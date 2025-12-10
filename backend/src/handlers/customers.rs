use axum::{
    extract::{State, Json, Extension},
    response::IntoResponse,
    http::StatusCode,
};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{Customer, CreateCustomerRequest};
use crate::auth::Claims;

pub async fn list_customers(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    // If tenant_id is in claims, filter by it.
    // If claims.role is super_admin and no tenant_id, maybe list all? 
    // For now assume "tenant_id" is always present for store ops.
    // But Super Admin might not have a tenant_id. 
    // Safely unwrap or handle logic.
    
    let tenant_id = match claims.tenant_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, "Tenant ID missing").into_response(),
    };

    let customers = sqlx::query_as::<_, Customer>("SELECT * FROM customers WHERE tenant_id = ?")
        .bind(tenant_id)
        .fetch_all(&pool)
        .await;

    match customers {
        Ok(customers) => Json(customers).into_response(),
        Err(e) => {
            eprintln!("Failed to list customers: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to list customers").into_response()
        }
    }
}

pub async fn create_customer(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateCustomerRequest>,
) -> impl IntoResponse {
    let tenant_id = match claims.tenant_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, "Tenant ID missing").into_response(),
    };

    let id = Uuid::new_v4().to_string();

    let result = sqlx::query(
        "INSERT INTO customers (id, tenant_id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&payload.phone)
    .bind(&payload.notes)
    .execute(&pool)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(id)).into_response(),
        Err(e) => {
            eprintln!("Failed to create customer: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create customer").into_response()
        }
    }
}
