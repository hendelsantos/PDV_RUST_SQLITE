use axum::{Extension, extract::State, http::StatusCode, response::Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::auth::Claims;

#[derive(Debug, Serialize)]
pub struct MetricsOverview {
    total_revenue: i64,
    sales_count: i64,
    average_ticket: f64,
    products_count: i64,
    customers_count: i64,
}

#[derive(Debug, Serialize)]
pub struct SalesTrendPoint {
    date: String,
    revenue: i64,
    sales_count: i64,
}

#[derive(Debug, Serialize)]
pub struct TopProduct {
    product_id: String,
    product_name: String,
    quantity_sold: i64,
    revenue: i64,
}

#[derive(Debug, Serialize)]
pub struct InventoryAlert {
    product_id: String,
    product_name: String,
    current_stock: i64,
    min_stock: i64,
}

/// GET /api/metrics/overview
/// Retorna métricas gerais do negócio
pub async fn get_overview(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<MetricsOverview>, StatusCode> {
    let tenant_id = &claims.tenant_id;

    // Total de receita
    let total_revenue: i64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE tenant_id = $1")
            .bind(tenant_id)
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Número de vendas
    let sales_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sales WHERE tenant_id = $1")
        .bind(tenant_id)
        .fetch_one(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Ticket médio
    let average_ticket = if sales_count > 0 {
        total_revenue as f64 / sales_count as f64
    } else {
        0.0
    };

    // Número de produtos
    let products_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM products WHERE tenant_id = $1")
            .bind(tenant_id)
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Número de clientes
    let customers_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM customers WHERE tenant_id = $1")
            .bind(tenant_id)
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(MetricsOverview {
        total_revenue,
        sales_count,
        average_ticket,
        products_count,
        customers_count,
    }))
}

/// GET /api/metrics/sales-trend?days=7
/// Retorna tendência de vendas dos últimos N dias
pub async fn get_sales_trend(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<SalesTrendPoint>>, StatusCode> {
    let tenant_id = &claims.tenant_id;

    // Buscar vendas dos últimos 7 dias agrupadas por data
    let trend = sqlx::query_as::<_, (String, i64, i64)>(
        r#"
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') as date,
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as sales_count
        FROM sales 
        WHERE tenant_id = $1 
        AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
        "#,
    )
    .bind(tenant_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = trend
        .into_iter()
        .map(|(date, revenue, sales_count)| SalesTrendPoint {
            date,
            revenue,
            sales_count,
        })
        .collect();

    Ok(Json(result))
}

/// GET /api/metrics/top-products?limit=5
/// Retorna os produtos mais vendidos
pub async fn get_top_products(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<TopProduct>>, StatusCode> {
    let tenant_id = &claims.tenant_id;

    let top_products = sqlx::query_as::<_, (String, String, i64, i64)>(
        r#"
        SELECT 
            si.product_id,
            p.name as product_name,
            SUM(si.quantity) as quantity_sold,
            SUM(si.subtotal) as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.tenant_id = $1
        GROUP BY si.product_id, p.name
        ORDER BY quantity_sold DESC
        LIMIT 5
        "#,
    )
    .bind(tenant_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = top_products
        .into_iter()
        .map(
            |(product_id, product_name, quantity_sold, revenue)| TopProduct {
                product_id,
                product_name,
                quantity_sold,
                revenue,
            },
        )
        .collect();

    Ok(Json(result))
}

/// GET /api/metrics/inventory-alerts
/// Retorna produtos com estoque baixo
pub async fn get_inventory_alerts(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<InventoryAlert>>, StatusCode> {
    let tenant_id = &claims.tenant_id;

    let alerts = sqlx::query_as::<_, (String, String, i64)>(
        r#"
        SELECT 
            id as product_id,
            name as product_name,
            stock as current_stock
        FROM products
        WHERE tenant_id = $1
        AND stock <= 10
        ORDER BY stock ASC
        LIMIT 10
        "#,
    )
    .bind(tenant_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = alerts
        .into_iter()
        .map(|(product_id, product_name, current_stock)| InventoryAlert {
            product_id,
            product_name,
            current_stock,
            min_stock: 10, // Valor fixo por enquanto
        })
        .collect();

    Ok(Json(result))
}
