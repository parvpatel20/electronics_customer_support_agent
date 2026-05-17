#!/usr/bin/env bash
# Quick SSE smoke tests for order tracking + RMA (requires running API + seeded MySQL).
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"

tmp1=$(mktemp)
tmp2=$(mktemp)
tmp4=$(mktemp)
trap 'rm -f "$tmp1" "$tmp2" "$tmp4"' EXIT

curl -sN -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST-IN-002","message":"Where is my soundbar? Order ORD-IN-002. I am in Bengaluru."}' \
  --max-time 120 >"$tmp1" || true

curl -sN -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST-IN-005","message":"Status of return RMA-IN-SNEHA01 for my watch."}' \
  --max-time 120 >"$tmp2" || true

curl -sN -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST-IN-001","message":"Am I eligible for a refund on order ORD-IN-001?"}' \
  --max-time 120 >"$tmp4" || true

fail=0
# Heuristic returns confidence 0.97 for ORD + where-is-my-item
if ! grep -q '"confidence": 0.97' "$tmp1" || ! grep -q lookup_order "$tmp1" || ! grep -q get_delivery_status "$tmp1"; then
  echo "FAIL: order query — expected heuristic confidence 0.97 + lookup_order + get_delivery_status"
  fail=1
fi
if grep -q search_product_docs "$tmp1"; then
  echo "FAIL: order query — should not call search_product_docs"
  fail=1
fi

if ! grep -q '"confidence": 0.99' "$tmp2" || ! grep -q get_return_status "$tmp2"; then
  echo "FAIL: RMA query — expected heuristic confidence 0.99 + get_return_status"
  fail=1
fi
if grep -q search_product_docs "$tmp2"; then
  echo "FAIL: RMA query — should not call search_product_docs"
  fail=1
fi

if ! grep -q '"route": "billing"' "$tmp4" || ! grep -q '"confidence": 0.94' "$tmp4"; then
  echo "FAIL: refund + ORD — expected billing heuristic (confidence 0.94)"
  fail=1
fi

if [[ "$fail" -eq 0 ]]; then
  echo "OK: smoke_chat passed (order + RMA + billing paths)."
  exit 0
fi
exit 1
