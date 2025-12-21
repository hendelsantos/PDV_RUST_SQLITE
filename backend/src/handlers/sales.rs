use crate::auth::Claims;
use crate::models::{CreateSaleRequest, Sale};
use axum::{
    Json,
    extract::{Extension, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Serialize;
use sqlx::{FromRow, PgPool, Row};
use uuid::Uuid;

pub async fn list_sales(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let sales = sqlx::query_as::<_, Sale>(
        "SELECT * FROM sales WHERE tenant_id = $1 ORDER BY created_at DESC",
    )
    .bind(&claims.tenant_id)
    .fetch_all(&pool)
    .await;

    match sales {
        Ok(sales) => (StatusCode::OK, Json(sales)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Database error: {}", e),
        )
            .into_response(),
    }
}

pub async fn create_sale(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateSaleRequest>,
) -> impl IntoResponse {
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to start transaction: {}", e),
            )
                .into_response();
        }
    };

    let sale_id = Uuid::new_v4().to_string();
    let mut total_amount = 0;

    // Validate items and calculate total
    for item in &payload.items {
        // Fetch product to get price and check stock
        let product = sqlx::query(
            "SELECT price, stock_quantity FROM products WHERE id = $1 AND tenant_id = $2",
        )
        .bind(&item.product_id)
        .bind(&claims.tenant_id)
        .fetch_optional(&mut *tx)
        .await;

        match product {
            Ok(Some(row)) => {
                let price: i32 = row.get("price");
                let stock: i32 = row.get("stock_quantity");

                if stock < item.quantity {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::BAD_REQUEST,
                        format!("Insufficient stock for product {}", item.product_id),
                    )
                        .into_response();
                }

                let subtotal = price * item.quantity;
                total_amount += subtotal;

                // Update stock
                let update_stock = sqlx::query(
                    "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                )
                .bind(item.quantity)
                .bind(&item.product_id)
                .execute(&mut *tx)
                .await;

                if let Err(e) = update_stock {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to update stock: {}", e),
                    )
                        .into_response();
                }

                // Insert Sale Item
                let item_id = Uuid::new_v4().to_string();
                let insert_item = sqlx::query("INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)")
                    .bind(&item_id)
                    .bind(&sale_id)
                    .bind(&item.product_id)
                    .bind(item.quantity)
                    .bind(price)
                    .bind(subtotal)
                    .execute(&mut *tx)
                    .await;

                if let Err(e) = insert_item {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to insert sale item: {}", e),
                    )
                        .into_response();
                }
            }
            Ok(None) => {
                let _ = tx.rollback().await;
                return (
                    StatusCode::BAD_REQUEST,
                    format!("Product {} not found", item.product_id),
                )
                    .into_response();
            }
            Err(e) => {
                let _ = tx.rollback().await;
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Database error fetching product: {}", e),
                )
                    .into_response();
            }
        }
    }

    // Insert Sale
    let insert_sale = sqlx::query("INSERT INTO sales (id, tenant_id, user_id, customer_id, total_amount, payment_method, status) VALUES ($1, $2, $3, $4, $5, $6, $7)")
        .bind(&sale_id)
        .bind(&claims.tenant_id)
        .bind(&claims.sub) // user_id from token sub
        .bind(&payload.customer_id)
        .bind(total_amount)
        .bind(&payload.payment_method)
        .bind("completed")
        .execute(&mut *tx)
        .await;

    if let Err(e) = insert_sale {
        let _ = tx.rollback().await;
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to insert sale: {}", e),
        )
            .into_response();
    }

    if let Err(e) = tx.commit().await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {}", e),
        )
            .into_response();
    }

    (StatusCode::CREATED, Json(sale_id)).into_response()
}

#[derive(Debug, Serialize, FromRow)]
pub struct DashboardStats {
    pub total_revenue: i32, /* Changed to i32 to match DB type usually, or i64 for safety */
    pub sales_count: i32,
    pub recent_sales: Vec<Sale>,
}

pub async fn get_dashboard_stats(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let tenant_id = match claims.tenant_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, "Tenant ID missing").into_response(),
    };

    // Calculate total revenue
    let revenue_row: (i32,) =
        sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE tenant_id = $1")
            .bind(&tenant_id)
            .fetch_one(&pool)
            .await
            .unwrap_or((0,));

    let total_revenue = revenue_row.0;

    // Calculate sales count
    let count_row: (i32,) = sqlx::query_as("SELECT COUNT(*) FROM sales WHERE tenant_id = $1")
        .bind(&tenant_id)
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let sales_count = count_row.0;

    // Fetch recent sales (last 5)
    let recent_sales = sqlx::query_as::<_, Sale>(
        "SELECT * FROM sales WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5",
    )
    .bind(&tenant_id)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let stats = DashboardStats {
        total_revenue,
        sales_count,
        recent_sales,
    };

    Json(stats).into_response()
}
