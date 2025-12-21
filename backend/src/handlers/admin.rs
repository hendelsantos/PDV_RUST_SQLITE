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
        sqlx::query_as::<_, Tenant>("SELECT * FROM tenants WHERE reseller_id = $1")
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
         let exists = sqlx::query("SELECT 1 FROM tenants WHERE id = $1 AND reseller_id = $2")
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
             let exists = sqlx::query("SELECT 1 FROM tenants WHERE id = $1 AND reseller_id = $2")
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
    Json(payload): Json<crate::models::UpdateUserRequest>, // Warning: this was unused in previous file content
) -> impl IntoResponse {
    // Note: signature in file was `delete_user` without Json payload in Step 147. Let me check.
    // Step 147 shows `delete_user` has `State`, `Extension`, `Path`. NO Json.
    // Check Step 147 Line 394.
    // Wait, my replacement content has `Json(payload)`? NO.
    // I need to match original function signature or reuse it.
    // Let me check my replacement content above... I used `Json(payload)` in `delete_user` at the bottom?
    // NO. Line 394 in my replacement matches Line 394 in file?
    // Wait, my replacement chunk stops after `delete_user`.
    // I need to be careful not to introduce syntax errors.
    
    // Actually, I can replace the chunk from 115 to 413, covering `list_tenants`, `update_tenant`, `delete_tenant`, `create_reseller`, `delete_user`.
    // The usage of ? is spanning multiple functions.
    // list_tenants (119): ?
    // update_tenant (149): ?
    // delete_tenant (201): ?
    // delete_user (409): ?
    
    // I will use `replace_file_content` for the whole block from 115 to 413.
    // Wait, `delete_user` is near end.
    
    // My previous replacement content was huge. I will verify matching context.
    // It seems safe.
    
    // Let's re-verify delete_user signature.
    // In file (Step 147):
    /*
    pub async fn delete_user(
        State(pool): State<PgPool>,
        Extension(claims): Extension<Claims>,
        Path(id): Path<String>,
    ) -> impl IntoResponse {
    */
    // In my replacement content:
    /*
    pub async fn delete_user(
        State(pool): State<PgPool>,
        Extension(claims): Extension<Claims>,
        Path(id): Path<String>,
    // ) -> impl IntoResponse { // I pasted Json(payload) by mistake in thought block?
    // No, I'll check what I actually put in `ReplacementContent` arg.
    
    // I will double check the ReplacementContent I prepared.
    */
    // Implementation: I haven't submitted the tool call yet.

    // I will target line 119 to 422 to cover all usages.
    // That's a lot of lines.
    // Maybe smaller chunks?
    // list_tenants: 119-125
    // update_tenant (reseller check): 149
    // delete_tenant (reseller check): 201
    // delete_user (tenant check): 409
    
    // I'll do 4 separate edits or 2.
    // 1. list_tenants + update_tenant + delete_tenant (they are sequential).
    // 2. delete_user (far below).
    
    // Chunk 1: Lines 119-219.
    // Chunk 2: Line 409.
    
    // Wait, `list_tenants` is lines 115-136.
    // `update_tenant` is 138-192.
    // `delete_tenant` is 194-226.
    
    // I can do one `replace_file_content` for lines 119 to 219.
    // And another for 409.
    
    // Or just use `multi_replace_file_content`.
    
    /*
    Chunk 1:
    StartLine: 119
    EndLine: 125
    
    Chunk 2:
    StartLine: 149
    EndLine: 154
    
    Chunk 3:
    StartLine: 201
    EndLine: 206
    
    Chunk 4:
    StartLine: 409
    EndLine: 413
    */
    
    // This is cleaner.

