use axum::{
    Json,
    response::IntoResponse,
    http::StatusCode,
    extract::{State, Extension},
};
use sqlx::{PgPool, Row};
use crate::models::{CreateProductRequest, Product};
use uuid::Uuid;
use crate::auth::Claims;

pub async fn list_products(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    // Filter by tenant_id from claims
    let products = sqlx::query_as::<_, Product>("SELECT * FROM products WHERE tenant_id = $1")
        .bind(&claims.tenant_id)
        .fetch_all(&pool)
        .await;

    match products {
        Ok(products) => (StatusCode::OK, Json(products)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response(),
    }
}

pub async fn create_product(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateProductRequest>,
) -> impl IntoResponse {
    let product_id = Uuid::new_v4().to_string();

    let result = sqlx::query("INSERT INTO products (id, tenant_id, name, description, price, stock_quantity, sku) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(&product_id)
        .bind(&claims.tenant_id)
        .bind(&payload.name)
        .bind(&payload.description)
        .bind(payload.price)
        .bind(payload.stock_quantity)
        .bind(&payload.sku)
        .execute(&pool)
        .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(product_id)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)).into_response(),
    }
}
