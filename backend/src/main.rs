use axum::{
    routing::{get, post, put, delete},
    Router,
    middleware as axum_middleware,
};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use dotenvy::dotenv;
use std::env;

mod auth;
mod models;
mod handlers;
mod middleware;

use tower_http::cors::CorsLayer;

async fn root() -> &'static str {
    "Hello, SaaS PDV!"
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    // Initialize tracing/logging later

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool.");

    // Auth Routes (Public)
    let auth_routes = Router::new()
        .route("/register", post(handlers::auth::register))
        .route("/login", post(handlers::auth::login));

    // Admin Routes (Protected)
    let admin_routes = Router::new()
        .route("/plans", post(handlers::admin::create_plan).get(handlers::admin::list_plans))
        .route("/tenants", post(handlers::admin::create_tenant).get(handlers::admin::list_tenants))
        .route("/resellers", post(handlers::admin::create_reseller).get(handlers::admin::list_resellers))
        .route("/users", post(handlers::admin::create_user_admin).get(handlers::admin::list_users))
        .route("/tenants/{id}", put(handlers::admin::update_tenant).delete(handlers::admin::delete_tenant))
        .route("/users/{id}", put(handlers::admin::update_user).delete(handlers::admin::delete_user))
        .route_layer(axum_middleware::from_fn(middleware::auth_middleware));

    // Product Routes (Protected)
    let product_routes = Router::new()
        .route("/", get(handlers::products::list_products).post(handlers::products::create_product))
        .route_layer(axum_middleware::from_fn(middleware::auth_middleware));

    // Sales Routes (Protected)
    let sales_routes = Router::new()
        .route("/", get(handlers::sales::list_sales).post(handlers::sales::create_sale))
        .route("/stats", get(handlers::sales::get_dashboard_stats))
        .route_layer(axum_middleware::from_fn(middleware::auth_middleware));

    // Customer Routes (Protected)
    let customer_routes = Router::new()
        .route("/", get(handlers::customers::list_customers).post(handlers::customers::create_customer))
        .route_layer(axum_middleware::from_fn(middleware::auth_middleware));

    // Metrics Routes (Protected)
    let metrics_routes = Router::new()
        .route("/overview", get(handlers::metrics::get_overview))
        .route("/sales-trend", get(handlers::metrics::get_sales_trend))
        .route("/top-products", get(handlers::metrics::get_top_products))
        .route("/inventory-alerts", get(handlers::metrics::get_inventory_alerts))
        .route_layer(axum_middleware::from_fn(middleware::auth_middleware));

    // Combine routes
    let app = Router::new()
        .route("/", get(root))
        .nest("/auth", auth_routes)
        .nest("/admin", admin_routes)
        .nest("/products", product_routes)
        .nest("/sales", sales_routes)
        .nest("/customers", customer_routes)
        .nest("/metrics", metrics_routes)

        .layer(CorsLayer::permissive()) // Enable CORS for all
        .with_state(pool);

    // Run it
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on {}", addr);
    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

