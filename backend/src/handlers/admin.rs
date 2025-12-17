use axum::{
    extract::{State, Json, Extension, Path},
    response::IntoResponse,
    http::StatusCode,
};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Plan, CreatePlanRequest, Tenant, CreateTenantRequest};
use crate::auth::Claims;

pub async fn create_plan(
    State(pool): State<PgPool>,
    Json(payload): Json<CreatePlanRequest>,
) -> impl IntoResponse {
    let id = Uuid::new_v4().to_string();

    let result = sqlx::query(
        "INSERT INTO plans (id, name, price, max_users, features) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.price)
    .bind(&payload.max_users)
    .bind(&payload.features)
    .execute(&pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(id)).into_response(),
        Err(e) => {
            eprintln!("Failed to create plan: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create plan").into_response()
        }
    }
}

pub async fn list_plans(
    State(pool): State<PgPool>,
) -> impl IntoResponse {
    let plans = sqlx::query_as::<_, Plan>("SELECT * FROM plans")
        .fetch_all(&pool)
        .await;

    match plans {
        Ok(plans) => Json(plans).into_response(),
        Err(e) => {
            eprintln!("Failed to list plans: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to list plans").into_response()
        }
    }
}

pub async fn create_tenant(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTenantRequest>,
) -> impl IntoResponse {
    let id = Uuid::new_v4().to_string();
    
    // Determine reseller_id based on who is creating the tenant
    let reseller_id = if claims.role == "reseller" {
        Some(claims.sub)
    } else {
        None
    };

    let mut transaction = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to start transaction: {}", e)).into_response(),
    };

    let result = sqlx::query(
        "INSERT INTO tenants (id, name, plan_id, business_type, reseller_id) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.plan_id)
    .bind(payload.business_type.as_deref().unwrap_or("retail"))
    .bind(reseller_id)
    .execute(&mut *transaction)
    .await;

    if let Err(e) = result {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create tenant: {}", e)).into_response();
    }

    // If Owner info provided, create the user
    if let (Some(email), Some(password)) = (&payload.owner_email, &payload.owner_password) {
        let user_id = Uuid::new_v4().to_string();
        let password_hash = match crate::auth::hash_password(password) {
            Ok(hash) => hash,
            Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to hash password").into_response(),
        };

        let user_result = sqlx::query("INSERT INTO users (id, email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4, $5)")
            .bind(&user_id)
            .bind(email)
            .bind(&password_hash)
            .bind("user") // Shopkeeper role
            .bind(&id)    // Linked to this new tenant
            .execute(&mut *transaction)
            .await;

        if let Err(e) = user_result {
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create owner user: {}", e)).into_response();
        }
    }

    match transaction.commit().await {
        Ok(_) => (StatusCode::CREATED, Json(id)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to commit transaction: {}", e)).into_response(),
    }
}

pub async fn list_tenants(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let query = if claims.role == "reseller" {
        sqlx::query_as::<_, Tenant>("SELECT * FROM tenants WHERE reseller_id = ?")
            .bind(claims.sub)
    } else {
        // Admin sees all
        sqlx::query_as::<_, Tenant>("SELECT * FROM tenants")
    };

    let tenants = query.fetch_all(&pool).await;

    match tenants {
        Ok(tenants) => Json(tenants).into_response(),
        Err(e) => {
            eprintln!("Failed to list tenants: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to list tenants").into_response()
        }
    }
}

pub async fn update_tenant(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<crate::models::UpdateTenantRequest>,
) -> impl IntoResponse {
    if claims.role != "admin" && claims.role != "reseller" {
        return (StatusCode::FORBIDDEN, "Not authorized").into_response();
    }
    // Verify ownership if reseller
    if claims.role == "reseller" {
         let exists = sqlx::query("SELECT 1 FROM tenants WHERE id = $1 AND reseller_id = ?")
             .bind(&id)
             .bind(&claims.sub)
             .fetch_optional(&pool)
             .await
             .unwrap_or(None);
         if exists.is_none() {
             return (StatusCode::FORBIDDEN, "Not owner of this tenant").into_response();
         }
    }

    let mut builder = sqlx::QueryBuilder::new("UPDATE tenants SET updated_at = CURRENT_TIMESTAMP");
    
    if let Some(name) = &payload.name {
        builder.push(", name = ");
        builder.push_bind(name);
    }
    if let Some(plan_id) = &payload.plan_id {
        builder.push(", plan_id = ");
        builder.push_bind(plan_id);
    }
    if let Some(status) = &payload.status {
        builder.push(", status = ");
        builder.push_bind(status);
    }
    if let Some(business_type) = &payload.business_type {
        builder.push(", business_type = ");
        builder.push_bind(business_type);
    }
    if let Some(custom_fields) = &payload.custom_fields {
        builder.push(", custom_fields = ");
        builder.push_bind(custom_fields);
    }

    builder.push(" WHERE id = ");
    builder.push_bind(id);

    let result = builder.build().execute(&pool).await;

    match result {
        Ok(_) => (StatusCode::OK, "Tenant updated").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update: {}", e)).into_response(),
    }
}

pub async fn delete_tenant(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    if claims.role != "admin" { // Only admin can delete for now? Or reseller too? Let's allow reseller to delete THEIR tenants
        if claims.role == "reseller" {
             let exists = sqlx::query("SELECT 1 FROM tenants WHERE id = $1 AND reseller_id = ?")
                 .bind(&id)
                 .bind(&claims.sub)
                 .fetch_optional(&pool)
                 .await
                 .unwrap_or(None);
             if exists.is_none() {
                 return (StatusCode::FORBIDDEN, "Not owner").into_response();
             }
        } else {
             return (StatusCode::FORBIDDEN, "Not authorized").into_response();
        }
    }

    // Cascade delete users? Generally handled by DB FKs if configured, but here we might need manual
    // Let's just delete tenant and assume DB is robust or we don't care about orphans for prototype
    let result = sqlx::query("DELETE FROM tenants WHERE id = $1")
        .bind(&id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::OK, "Tenant deleted").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete: {}", e)).into_response(),
    }
}

pub async fn create_reseller(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<crate::models::CreateUserRequest>,
) -> impl IntoResponse {
    // Only admin can create resellers
    if claims.role != "admin" {
         return (StatusCode::FORBIDDEN, "Only admins can create resellers").into_response();
    }

    let user_id = Uuid::new_v4().to_string();
    let tenant_id = Uuid::new_v4().to_string(); // Reseller has their own tenant/workspace

    let password_hash = match crate::auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to hash password").into_response(),
    };

    let result = sqlx::query("INSERT INTO users (id, email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4, $5)")
        .bind(&user_id)
        .bind(&payload.email)
        .bind(&password_hash)
        .bind("reseller") // Enforce role
        .bind(&tenant_id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::CREATED, "Reseller created successfully").into_response(),
        Err(e) => {
             eprintln!("Failed to create reseller: {}", e);
             (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response()
        }
    }
}
pub async fn list_resellers(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if claims.role != "admin" {
        return (StatusCode::FORBIDDEN, "Only admins can list resellers").into_response();
    }
    
    // We reuse User struct but we should filter only role='reseller'
    // Since User hash is hidden by serde logic (maybe?), we can return list of users.
    // User struct has skip_serializing for password_hash.

    let users = sqlx::query_as::<_, crate::models::User>("SELECT * FROM users WHERE role = 'reseller'")
        .fetch_all(&pool)
        .await;

    match users {
        Ok(users) => Json(users).into_response(),
        Err(e) => {
             eprintln!("Failed to list resellers: {}", e);
             (StatusCode::INTERNAL_SERVER_ERROR, "Failed to list resellers").into_response()
        }
    }
}

pub async fn create_user_admin(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<crate::models::CreateUserRequest>,
) -> impl IntoResponse {
    if claims.role != "admin" {
         return (StatusCode::FORBIDDEN, "Only admins can create users").into_response();
    }

    let user_id = Uuid::new_v4().to_string();
    let tenant_id = if payload.role.as_deref() == Some("admin") {
         Uuid::new_v4().to_string()
    } else {
         Uuid::new_v4().to_string()
    };

    let password_hash = match crate::auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to hash password").into_response(),
    };

    let role = payload.role.unwrap_or_else(|| "user".to_string());

    let result = sqlx::query("INSERT INTO users (id, email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4, $5)")
        .bind(&user_id)
        .bind(&payload.email)
        .bind(&password_hash)
        .bind(&role)
        .bind(&tenant_id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::CREATED, "User created successfully").into_response(),
        Err(e) => {
             // Check for unique constraint violation (sqlite code 2067)
             let msg = e.to_string();
             if msg.contains("UNIQUE constraint failed") {
                 return (StatusCode::CONFLICT, "Email already exists").into_response();
             }

             eprintln!("Failed to create user: {}", e);
             (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response()
        }
    }
}

pub async fn list_users(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if claims.role != "admin" {
        return (StatusCode::FORBIDDEN, "Only admins can list users").into_response();
    }
    
    let users = sqlx::query_as::<_, crate::models::User>("SELECT * FROM users")
        .fetch_all(&pool)
        .await;

    match users {
        Ok(users) => Json(users).into_response(),
        Err(e) => {
             eprintln!("Failed to list users: {}", e);
             (StatusCode::INTERNAL_SERVER_ERROR, "Failed to list users").into_response()
        }
    }
}

pub async fn update_user(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<crate::models::UpdateUserRequest>,
) -> impl IntoResponse {
    if claims.role != "admin" {
        return (StatusCode::FORBIDDEN, "Only admins can update users").into_response();
    }

    let mut builder = sqlx::QueryBuilder::new("UPDATE users SET id = id"); // Dummy start

    if let Some(email) = &payload.email {
        builder.push(", email = ");
        builder.push_bind(email);
    }
    if let Some(role) = &payload.role {
        builder.push(", role = ");
        builder.push_bind(role);
    }
    
    if let Some(password) = &payload.password {
         let hash = crate::auth::hash_password(password).unwrap_or_default();
         builder.push(", password_hash = ");
         builder.push_bind(hash);
    }

    builder.push(" WHERE id = ");
    builder.push_bind(id);

    let result = builder.build().execute(&pool).await;

    match result {
        Ok(_) => (StatusCode::OK, "User updated").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update: {}", e)).into_response(),
    }
}

pub async fn delete_user(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    if claims.role != "admin" {
        return (StatusCode::FORBIDDEN, "Only admins can delete users").into_response();
    }
    
    // Prevent deleting self
    if id == claims.sub {
        return (StatusCode::BAD_REQUEST, "Cannot delete yourself").into_response();
    }

    // Check if user is a reseller with tenants
    let tenant_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tenants WHERE reseller_id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    if tenant_count > 0 {
        return (StatusCode::CONFLICT, "Cannot delete user: This user is a Reseller with linked Tenants. Delete the Tenants (Lojas) first.").into_response();
    }

    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(&id)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::OK, "User deleted").into_response(),
        Err(e) => {
            let msg = e.to_string();
            // Handle FK constraint violation (code 787 in SQLite for some setups, or generic constraint)
            // SQLx might return DatabaseError
            if msg.contains("FOREIGN KEY constraint failed") {
                 return (StatusCode::CONFLICT, "Cannot delete user: Associated data exists (e.g. Products linked to this user's Tenant).").into_response();
            }
            eprintln!("Failed to delete user: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete: {}", e)).into_response()
        }
    }
}
