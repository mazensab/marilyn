from __future__ import annotations
from decimal import (
    Decimal,
    InvalidOperation,
    ROUND_HALF_UP,
)
from typing import Any
# =============================================================
# Marilyn Clinics
# Public Booking Customer-Payable Pricing Foundation
#
# IMPORTANT:
# - This module calculates CUSTOMER PAYABLE amounts only.
# - It does not create invoices.
# - It does not make VAT filings.
# - It does not create government reimbursement claims.
# - It does not decide whether a service qualifies for a
#   government-borne VAT treatment.
#
# Qualification is an explicit service-policy input.
# =============================================================
MONEY_QUANTUM = Decimal(
    "0.01"
)
PERCENT_DIVISOR = Decimal(
    "100"
)
PUBLIC_VAT_PROFILE_SAUDI_CITIZEN = (
    "SAUDI_CITIZEN"
)
PUBLIC_VAT_PROFILE_NON_SAUDI = (
    "NON_SAUDI"
)
PUBLIC_VAT_PROFILES = frozenset(
    {
        PUBLIC_VAT_PROFILE_SAUDI_CITIZEN,
        PUBLIC_VAT_PROFILE_NON_SAUDI,
    }
)
class PublicBookingPricingError(
    ValueError
):
    pass
def _money(
    value: Any,
) -> Decimal:
    try:
        result = Decimal(
            str(
                value
            )
        )
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ) as error:
        raise PublicBookingPricingError(
            "Invalid monetary value."
        ) from error
    if not result.is_finite():
        raise PublicBookingPricingError(
            "Monetary value must be finite."
        )
    return result.quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP,
    )
def _rate(
    value: Any,
) -> Decimal:
    try:
        result = Decimal(
            str(
                value
            )
        )
    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ) as error:
        raise PublicBookingPricingError(
            "Invalid tax rate."
        ) from error
    if not result.is_finite():
        raise PublicBookingPricingError(
            "Tax rate must be finite."
        )
    if result < Decimal("0"):
        raise PublicBookingPricingError(
            "Tax rate cannot be negative."
        )
    return result.quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP,
    )
def normalize_public_vat_profile(
    value: Any,
) -> str:
    profile = str(
        value or ""
    ).strip().upper()
    if profile not in PUBLIC_VAT_PROFILES:
        raise PublicBookingPricingError(
            "Unsupported public VAT profile."
        )
    return profile
def public_booking_customer_price_quote(
    *,
    base_amount: Any,
    taxable: bool,
    tax_rate: Any,
    customer_vat_profile: str,
    saudi_citizen_government_borne: bool,
) -> dict[str, Any]:
    """
    Calculate the amount payable by the booking customer.
    `saudi_citizen_government_borne` is an explicit
    service-policy decision supplied by the caller.
    It MUST NOT be inferred merely from:
    - the service category,
    - the customer's name,
    - the clinic,
    - or the fact that CatalogItem.taxable is True.
    When the explicit policy is enabled:
    SAUDI_CITIZEN:
        base amount remains payable by customer.
        calculated VAT is tracked as government-borne
        for pricing/audit context and is NOT added to
        customer payable total.
    NON_SAUDI:
        standard calculated VAT is added to the
        customer payable total.
    This function is not an invoice or tax filing engine.
    """
    profile = normalize_public_vat_profile(
        customer_vat_profile
    )
    base = _money(
        base_amount
    )
    if base < Decimal("0.00"):
        raise PublicBookingPricingError(
            "Base amount cannot be negative."
        )
    rate = _rate(
        tax_rate
    )
    is_taxable = bool(
        taxable
    )
    government_policy = bool(
        saudi_citizen_government_borne
    )
    if not is_taxable:
        standard_tax = Decimal(
            "0.00"
        )
    else:
        standard_tax = (
            base
            * rate
            / PERCENT_DIVISOR
        ).quantize(
            MONEY_QUANTUM,
            rounding=ROUND_HALF_UP,
        )
    government_borne = bool(
        is_taxable
        and government_policy
        and profile
        == PUBLIC_VAT_PROFILE_SAUDI_CITIZEN
    )
    if government_borne:
        customer_tax = Decimal(
            "0.00"
        )
        government_borne_tax = (
            standard_tax
        )
    else:
        customer_tax = (
            standard_tax
        )
        government_borne_tax = Decimal(
            "0.00"
        )
    customer_total = (
        base
        + customer_tax
    ).quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP,
    )
    return {
        "customer_vat_profile":
            profile,
        "base_amount":
            base,
        "taxable":
            is_taxable,
        "tax_rate":
            rate,
        "standard_tax_amount":
            standard_tax,
        "saudi_citizen_government_borne":
            government_policy,
        "government_borne_applied":
            government_borne,
        "government_borne_tax_amount":
            government_borne_tax,
        "customer_tax_amount":
            customer_tax,
        "customer_total":
            customer_total,
    }
def serialize_public_booking_price_quote(
    quote: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert the internal Decimal quote to a safe JSON-ready
    representation for later public API integration.
    """
    money_fields = {
        "base_amount",
        "tax_rate",
        "standard_tax_amount",
        "government_borne_tax_amount",
        "customer_tax_amount",
        "customer_total",
    }
    serialized: dict[str, Any] = {}
    for key, value in quote.items():
        if (
            key in money_fields
            and isinstance(
                value,
                Decimal,
            )
        ):
            serialized[
                key
            ] = format(
                value,
                ".2f",
            )
        else:
            serialized[
                key
            ] = value
    return serialized
