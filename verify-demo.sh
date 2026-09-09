#!/bin/bash
#
# verify-demo.sh — Versa Demo Readiness Check
#
# Run this to verify the app is fully demo-ready.
# Usage: ./verify-demo.sh
#

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

passed=0
failed=0
failures=()

check() {
  local label="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo -e "  ${GREEN}PASS${NC} $label"
    ((passed++))
  else
    echo -e "  ${RED}FAIL${NC} $label"
    ((failed++))
    failures+=("$label")
  fi
}

echo ""
echo "========================================"
echo "  Versa Demo Readiness Check"
echo "========================================"
echo ""

# ── 1. Prerequisites ──────────────────────
echo -e "${BOLD}1. Prerequisites${NC}"
check "Docker is running" docker info
check "Supabase CLI installed" command -v supabase
check "Node.js available" command -v node
check "Maestro installed" command -v maestro

# ── 2. Supabase Backend ──────────────────
echo ""
echo -e "${BOLD}2. Supabase Backend${NC}"

# Check supabase status
if supabase status > /dev/null 2>&1; then
  echo -e "  ${GREEN}PASS${NC} Supabase is running"
  ((passed++))
else
  echo -e "  ${RED}FAIL${NC} Supabase is not running (run: supabase start && supabase db reset)"
  ((failed++))
  failures+=("Supabase is not running")
fi

# ── 3. Database Verification ─────────────
echo ""
echo -e "${BOLD}3. Database Verification${NC}"
if node test-supabase.mjs > /dev/null 2>&1; then
  echo -e "  ${GREEN}PASS${NC} Backend tests (42+ assertions)"
  ((passed++))
else
  echo -e "  ${RED}FAIL${NC} Backend tests failed (run: node test-supabase.mjs for details)"
  ((failed++))
  failures+=("Backend tests")
fi

# ── 4. Unit Tests ────────────────────────
echo ""
echo -e "${BOLD}4. Unit Tests${NC}"
if npm test > /dev/null 2>&1; then
  echo -e "  ${GREEN}PASS${NC} All unit tests (242+ tests)"
  ((passed++))
else
  echo -e "  ${RED}FAIL${NC} Unit tests failed (run: npm test for details)"
  ((failed++))
  failures+=("Unit tests")
fi

# ── 5. TypeScript Check ─────────────────
echo ""
echo -e "${BOLD}5. TypeScript${NC}"
if npx tsc --noEmit > /dev/null 2>&1; then
  echo -e "  ${GREEN}PASS${NC} No TypeScript errors"
  ((passed++))
else
  echo -e "  ${YELLOW}WARN${NC} TypeScript errors found (run: npx tsc --noEmit)"
  ((failed++))
  failures+=("TypeScript errors")
fi

# ── 6. iOS Simulator ────────────────────
echo ""
echo -e "${BOLD}6. iOS Simulator${NC}"
if xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
  echo -e "  ${GREEN}PASS${NC} iOS Simulator is booted"
  ((passed++))
else
  echo -e "  ${YELLOW}WARN${NC} No iOS Simulator booted (start one in Xcode or with xcrun simctl boot)"
  ((failed++))
  failures+=("No iOS Simulator booted")
fi

# ── 7. Edge Functions Secrets ────────────
echo ""
echo -e "${BOLD}7. Edge Function Secrets${NC}"
if [ -f "supabase/.env" ]; then
  local_keys=$(grep -c "=.\+" supabase/.env 2>/dev/null || echo 0)
  if [ "$local_keys" -ge 4 ]; then
    echo -e "  ${GREEN}PASS${NC} Edge function secrets configured ($local_keys keys)"
    ((passed++))
  else
    echo -e "  ${YELLOW}WARN${NC} Only $local_keys secrets in supabase/.env (need at least 4)"
    ((failed++))
    failures+=("Edge function secrets incomplete")
  fi
else
  echo -e "  ${RED}FAIL${NC} supabase/.env not found"
  ((failed++))
  failures+=("supabase/.env missing")
fi

# ── Summary ──────────────────────────────
echo ""
echo "========================================"
if [ $failed -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}DEMO READY${NC}  ($passed/$((passed+failed)) checks passed)"
else
  echo -e "  ${RED}${BOLD}NOT READY${NC}   ($passed passed, $failed failed)"
  echo ""
  echo "  Failed checks:"
  for f in "${failures[@]}"; do
    echo "    - $f"
  done
fi
echo "========================================"
echo ""
