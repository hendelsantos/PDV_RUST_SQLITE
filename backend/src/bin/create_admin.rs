use argon2::{
    Argon2,
    password_hash::{PasswordHasher, SaltString, rand_core::OsRng},
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use uuid::Uuid;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .connect(&database_url)
        .await
        .expect("Failed to create pool.");

    let username = "hendel";
    let password = "#Ervilha20#";

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string();
    let id = Uuid::new_v4().to_string();

    // Upsert user
    let result = sqlx::query(
        "INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role"
    )
    .bind(&id)
    .bind(username)
    .bind(password_hash)
    .bind("super_admin")
    .execute(&pool)
    .await;

    match result {
        Ok(_) => println!("Successfully created superuser: {}", username),
        Err(e) => eprintln!("Failed to create user: {}", e),
    }
}
