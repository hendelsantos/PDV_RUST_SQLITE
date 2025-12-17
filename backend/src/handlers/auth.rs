use crate::auth;
use crate::models::{AuthResponse, CreateUserRequest, LoginRequest, User};
use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn register(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateUserRequest>,
) -> impl IntoResponse {
    let password_hash = match auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to hash password").into_response();
        }
    };

    let user_id = Uuid::new_v4();
    let tenant_id = Uuid::new_v4();

    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(user_id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(payload.role.unwrap_or_else(|| "user".to_string()))
    .bind(tenant_id)
    .execute(&pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, "User created successfully").into_response(),
        Err(e) => {
            // PostgreSQL unique constraint error code is 23505
            if e.to_string().contains("23505") || e.to_string().contains("duplicate key") {
                (StatusCode::CONFLICT, "Email already exists").into_response()
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Database error: {}", e),
                )
                    .into_response()
            }
        }
    }
}

pub async fn login(
    State(pool): State<PgPool>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let user = sqlx::query_as::<_, User>(
        "SELECT id::text, email, password_hash, role, tenant_id::text as tenant_id, created_at FROM users WHERE email = $1"
    )
    .bind(&payload.email)
    .fetch_optional(&pool)
    .await;

    match user {
        Ok(Some(user)) => {
            if auth::verify_password(&user.password_hash, &payload.password) {
                // Fetch tenant info to get business_type
                let business_type = if let Some(ref tenant_id_str) = user.tenant_id {
                    let tenant_uuid = match Uuid::parse_str(tenant_id_str) {
                        Ok(uuid) => uuid,
                        Err(_) => {
                            return (StatusCode::INTERNAL_SERVER_ERROR, "Invalid tenant ID")
                                .into_response();
                        }
                    };

                    let tenant: Option<(Option<String>,)> =
                        sqlx::query_as("SELECT business_type FROM tenants WHERE id = $1")
                            .bind(tenant_uuid)
                            .fetch_optional(&pool)
                            .await
                            .unwrap_or(None);

                    tenant.and_then(|(bt,)| bt)
                } else {
                    None
                };

                let token = match auth::create_jwt(
                    &user.id,
                    user.tenant_id.as_deref(),
                    &user.role,
                    b"secret",
                ) {
                    Ok(t) => t,
                    Err(_) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            "Failed to generate token",
                        )
                            .into_response();
                    }
                };

                (
                    StatusCode::OK,
                    Json(AuthResponse {
                        token,
                        role: user.role,
                        business_type,
                        email: user.email,
                        name: None,
                    }),
                )
                    .into_response()
            } else {
                (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Database error: {}", e),
        )
            .into_response(),
    }
}
