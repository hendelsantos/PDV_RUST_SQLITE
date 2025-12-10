use axum::{
    Json,
    response::IntoResponse,
    http::StatusCode,
    extract::State,
};
use sqlx::SqlitePool;
use crate::models::{CreateUserRequest, LoginRequest, AuthResponse, User};
use crate::auth;
use uuid::Uuid;

pub async fn register(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateUserRequest>,
) -> impl IntoResponse {
    let password_hash = match auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to hash password").into_response(),
    };

    let user_id = Uuid::new_v4().to_string();
    let tenant_id = Uuid::new_v4().to_string(); 

    let result = sqlx::query("INSERT INTO users (id, email, password_hash, role, tenant_id) VALUES (?, ?, ?, ?, ?)")
        .bind(&user_id)
        .bind(&payload.email)
        .bind(&password_hash)
        .bind(payload.role.unwrap_or_else(|| "user".to_string()))
        .bind(&tenant_id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::CREATED, "User created successfully").into_response(),
        Err(e) => {
            if e.to_string().contains("UNIQUE constraint failed") {
                 (StatusCode::CONFLICT, "Email already exists").into_response()
            } else {
                 (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response()
            }
        }
    }
}

pub async fn login(
    State(pool): State<SqlitePool>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    // Note: We need to select tenant_id to put in the token claims ideally, or just user_id
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await;

    match user {
        Ok(Some(user)) => {
            if auth::verify_password(&user.password_hash, &payload.password) {
                // Fetch tenant info to get business_type
                let business_type = if let Some(tenant_id) = &user.tenant_id {
                    let tenant = sqlx::query!("SELECT business_type FROM tenants WHERE id = ?", tenant_id)
                        .fetch_optional(&pool)
                        .await
                        .unwrap_or(None); // Ignore error, just None
                    tenant.and_then(|t| t.business_type)
                } else {
                    None
                };

                let token = match auth::create_jwt(&user.id, user.tenant_id.as_deref(), &user.role, b"secret") { 
                    Ok(t) => t,
                    Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate token").into_response(),
                };

                (StatusCode::OK, Json(AuthResponse { 
                    token,
                    role: user.role,
                    business_type,
                    email: user.email,
                    name: None 
                })).into_response()
            } else {
                (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response()
            }
        }
        Ok(None) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response(),
    }
}
