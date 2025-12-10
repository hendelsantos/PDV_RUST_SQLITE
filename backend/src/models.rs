use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub tenant_id: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub role: String,
    pub business_type: Option<String>,
    pub name: Option<String>, // if we had name column, but we have email.
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub description: Option<String>,
    pub price: i32,
    pub stock_quantity: i32,
    pub sku: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub description: Option<String>,
    pub price: i32,
    pub stock_quantity: i32,
    pub sku: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<i32>,
    pub stock_quantity: Option<i32>,
    pub sku: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Sale {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub customer_id: Option<String>,
    pub total_amount: i64,
    pub payment_method: String,
    pub status: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateSaleRequest {
    pub items: Vec<CreateSaleItemRequest>,
    pub payment_method: String,
    pub customer_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSaleItemRequest {
    pub product_id: String,
    pub quantity: i32,
}



#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Plan {
    pub id: String,
    pub name: String,
    pub price: i32, /* in cents */
    pub max_users: i32,
    pub features: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlanRequest {
    pub name: String,
    pub price: i32,
    pub max_users: i32,
    pub features: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub plan_id: Option<String>,
    pub status: String,
    pub business_type: Option<String>,
    pub reseller_id: Option<String>,
    pub created_at: String,
    pub custom_fields: Option<String>, // JSON string
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTenantRequest {
    pub name: String,
    pub plan_id: Option<String>,
    pub business_type: Option<String>,
    pub owner_email: Option<String>,
    pub owner_password: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTenantRequest {
    pub name: Option<String>,
    pub plan_id: Option<String>,
    pub status: Option<String>,
    pub business_type: Option<String>,
    pub custom_fields: Option<String>, // JSON string
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Customer {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerRequest {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
}
