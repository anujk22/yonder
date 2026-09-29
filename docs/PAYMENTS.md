# Pricing and payments

How Yonder makes money, what each payment costs, and what is real in this build.

## The three ways to get an answer

For a question about a place, the asker picks one:

| Option | Price | Who gets the money |
|---|---|---|
| An answer from a day or more ago | Free | — |
| The latest answer from the last day | $0.50 (store price) | Yonder, through an in-app purchase |
| A fresh look: post a bounty | $2.00 minimum, any higher amount | Split between the Scout and Yonder |

Collections, saving places and the map are always free.

## Bounty split

Yonder keeps **$1 of the $2 minimum**, plus **3% of anything above $2**. The Scout gets the rest.

| Bounty | Yonder | Scout |
|---|---|---|
| $2.00 | $1.00 | $1.00 |
| $5.00 | $1.09 | $3.91 |
| $10.00 | $1.24 | $8.76 |
| $20.00 | $1.54 | $18.46 |

The 3% covers the card processing cost of the extra amount (Stripe charges 2.9% + 30¢), so Yonder's profit per bounty stays about the same no matter how big the bounty is. The poster is only billed if they get an answer. Code: [`src/lib/pricing.ts`](../src/lib/pricing.ts).

## Collecting from posters: a running tab

Charging a card for every $2 bounty would cost about 36¢ each. Instead, answered bounties go on a tab that is charged as one card payment:

- **when the tab reaches $5, or after 7 days**, whichever comes first;
- **new posters are charged per bounty** until two charges have succeeded, then move to a tab;
- **no one can owe more than $10** across their tab and open requests;
- a declined card blocks new bounties (production only).

At about 2.5 bounties per charge, card fees drop to roughly 18¢ per bounty. Code: [`src/lib/ledger.ts`](../src/lib/ledger.ts).

## Paying Scouts: same-day bank deposit

Each accepted answer is paid out on its own, with no minimum balance. The planned provider is a bank payout service such as Dwolla (receive-only accounts, Same Day ACH, a few cents per transfer). Payouts sent before 3pm on a business day arrive that day; later ones arrive the next business day.

Alternatives we compared:

| Provider | Cost per payout | Why not the default |
|---|---|---|
| Stripe Connect | ~26¢ + $2/month per Scout paid that month | The monthly fee costs more than a casual Scout earns |
| PayPal / Venmo Payouts | 25¢ flat, instant | Not every Scout has PayPal or Venmo; kept as an option |
| Stripe Global Payouts | $1.50+ | Too expensive for $1 payouts |

Paying Scouts before the poster's tab is charged means Yonder briefly fronts the money. The tab limits above cap that exposure. Production also needs to stop Scouts from answering bounties posted from their own account or device, and to limit daily payouts for new Scouts.

## Unit economics per $2 bounty

| | Amount |
|---|---|
| Yonder's share | $1.00 |
| Card fee, on a tab (~2.5 bounties per charge) | −$0.18 |
| Bank payout (Dwolla estimate) | −$0.05 |
| **Yonder keeps** | **~$0.77** |

Each resale of a latest answer adds about 42¢ after the app store's 15% small-business commission, with no Scout payout.

## What is real in this build

- **Real:** buying the latest answer is an in-app purchase through RevenueCat (`yonder_recent_answer`, consumable). In development builds it uses RevenueCat's Test Store and charges nothing.
- **Simulated:** bounties, the tab and Scout payouts. No card or bank details are collected and no money moves. The app talks to payments only through [`src/lib/payments.ts`](../src/lib/payments.ts), so the Stripe and payout providers can be added later without changing the bounty logic.

A production version needs an authenticated server that holds the Stripe and payout keys, reviews evidence before settling, and receives payment webhooks.
