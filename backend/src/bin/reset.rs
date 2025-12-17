use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;

#[path = "../auth.rs"]
mod auth;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .connect(&database_url)
        .await
        .expect("Failed to connect to DB");

    let password = "123";
    let hash = auth::hash_password(password).expect("Failed to hash");

    sqlx::query("UPDATE users SET password_hash = $1 WHERE email = 'master@saas.com'")
        .bind(&hash)
        .execute(&pool)
        .await
        .expect("Failed to update password");

    println!("Password reset successfully for master@saas.com");
}
