#!/bin/bash

# Script to generate self-signed SSL certificates for development

SSL_DIR="./nginx/ssl"
DAYS=365
COUNTRY="CH"
STATE="Vaud"
CITY="Lausanne"
ORG="PokedEC"
CN="178.82.82.125"

echo "🔐 Generating self-signed SSL certificate..."
echo "This certificate will be valid for $DAYS days"
echo ""

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key and certificate
openssl req -x509 -nodes -days $DAYS -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$CN"

# Set proper permissions
chmod 600 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/fullchain.pem"

echo ""
echo "✅ SSL certificates generated successfully!"
echo "📁 Location: $SSL_DIR"
echo ""
echo "⚠️  Note: This is a self-signed certificate."
echo "   Browsers will show a security warning."
echo "   Click 'Advanced' and 'Proceed' to continue."
echo ""
echo "🔄 To use Let's Encrypt later (when you have a domain):"
echo "   1. Point your domain to this server"
echo "   2. Run: docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com"
echo "   3. Update nginx.conf to use the new certificates"
