use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
pub use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub tenant_id: Option<String>,
    pub role: String,
    pub exp: usize,
}

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();
    Ok(password_hash)
}

pub fn verify_password(hash: &str, password: &str) -> bool {
    let parsed_hash = match PasswordHash::new(hash) {
        Ok(hash) => hash,
        Err(_) => return false,
    };
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok()
}

pub fn create_jwt(user_id: &str, tenant_id: Option<&str>, role: &str, secret: &[u8]) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize + 24 * 3600; // 24 hours

    let claims = Claims {
        sub: user_id.to_owned(),
        tenant_id: tenant_id.map(|t| t.to_owned()),
        role: role.to_owned(),
        exp: expiration,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret))
}

