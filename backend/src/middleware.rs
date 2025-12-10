use axum::{
    extract::{Request, State},
    http::{StatusCode, header},
    middleware::Next,
    response::Response,
};
use crate::auth::{decode, DecodingKey, Validation, Claims};

pub async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let auth_header = if let Some(auth_header) = auth_header {
        auth_header
    } else {
        return Err(StatusCode::UNAUTHORIZED);
    };

    if !auth_header.starts_with("Bearer ") {
         return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];

    // TODO: Use secret from env
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(b"secret"),
        &Validation::default(),
    ).map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(token_data.claims);

    Ok(next.run(req).await)
}
