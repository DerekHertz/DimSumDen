# Jev eval: triage, jev-1.14.0, 2026-10-15

**Result:** FAIL on the bar.

- FAIL accuracy: 84.4% (bar 85.0%)
- pass safety: zero misses from floor 0.9
- pass cost: $0.000072 per case (bar $0.001)
- pass latency: p95 189 ms (bar 3000 ms)

Calls: 250; answered 250; right 211; skipped 0; errors 0.

## 5 runs of the same set, pooled below

| run | accuracy | misses | lowest floor with none |
|---|---|---|---|
| 1 | 84.0% | 3 | 0.9 |
| 2 | 84.0% | 3 | 0.9 |
| 3 | 84.0% | 3 | 0.9 |
| 4 | 84.0% | 3 | 0.9 |
| 5 | 86.0% | 3 | 0.9 |

## Confusion (rows: truth, columns: Jev)

| truth | flake | code | env | other |
|---|---|---|---|---|
| flake | 95 | 15 | 0 | 0 |
| code | 15 | 91 | 0 | 4 |
| env | 0 | 5 | 15 | 0 |
| other | 0 | 0 | 0 | 10 |

## Accuracy by confidence

| confidence | cases | right | accuracy |
|---|---|---|---|
| 0.00-0.50 | 8 | 5 | 62.5% |
| 0.50-0.70 | 44 | 28 | 63.6% |
| 0.70-0.80 | 35 | 29 | 82.9% |
| 0.80-0.90 | 54 | 40 | 74.1% |
| 0.90-1.00 | 109 | 109 | 100.0% |

## Safety misses: code labelled flake (a real failure called a flake: a rerun would hide it)

- 37085238561-111094045071 at 0.650
- 38514387350-115693976348 at 0.590
- 38662038548-116185334305 at 0.810
- 37085238561-111094045071 at 0.740
- 38514387350-115693976348 at 0.650
- 38662038548-116185334305 at 0.830
- 37085238561-111094045071 at 0.710
- 38514387350-115693976348 at 0.610
- 38662038548-116185334305 at 0.810
- 37085238561-111094045071 at 0.680
- 38514387350-115693976348 at 0.580
- 38662038548-116185334305 at 0.830
- 37085238561-111094045071 at 0.720
- 38514387350-115693976348 at 0.580
- 38662038548-116185334305 at 0.850

| floor | picks kept | right | accuracy kept | misses |
|---|---|---|---|---|
| 0 | 250 | 211 | 84.4% | 15 |
| 0.5 | 242 | 206 | 85.1% | 15 |
| 0.6 | 221 | 190 | 86.0% | 12 |
| 0.7 | 198 | 178 | 89.9% | 8 |
| 0.8 | 163 | 149 | 91.4% | 5 |
| 0.9 | 109 | 109 | 100.0% | 0 |
| 0.95 | 73 | 73 | 100.0% | 0 |

Lowest floor with zero misses: 0.9.

## Cost and speed

- Input tokens: 430305 (1721 per case)
- Cost: $0.018073 total, $0.000072 per case
- Latency: p50 114 ms, p95 189 ms

## Per case

| case | truth | Jev, each run (confidence) |
|---|---|---|
| 36449488488-109020262476 | code | code (0.93), code (0.95), code (0.93), code (0.94), code (0.94) |
| 36453814343-109034918693 | code | code (0.87), code (0.87), code (0.89), code (0.87), code (0.85) |
| 36510316871-109220752013 | code | code (0.75), code (0.78), code (0.74), code (0.70), code (0.83) |
| 36510510736-109221351319 | code | code (0.60), code (0.68), code (0.71), code (0.66), code (0.70) |
| 36641964490-109656068890 | code | code (0.85), code (0.88), code (0.88), code (0.89), code (0.89) |
| 36648366738-109676531404 | env | env (0.50), env (0.47), env (0.49), env (0.52), env (0.55) |
| 36752695653-110015041544 | flake | flake (0.97), flake (0.98), flake (0.98), flake (0.98), flake (0.98) |
| 36892672737-110471887246 | flake | flake (0.92), flake (0.93), flake (0.93), flake (0.90), flake (0.91) |
| 36899639408-110495289934 | flake | flake (0.98), flake (0.98), flake (0.98), flake (0.98), flake (0.98) |
| 36919826164-110562795958 | flake | flake (0.97), flake (0.97), flake (0.98), flake (0.97), flake (0.97) |
| 37029162141-110911341906 | flake | code (0.59), code (0.70), code (0.63), code (0.62), code (0.67) |
| 37032726331-110923294592 | flake | code (0.80), code (0.79), code (0.84), code (0.83), code (0.80) |
| 37034561600-110929431408 | flake | flake (0.59), flake (0.60), flake (0.65), flake (0.73), flake (0.66) |
| 37060542304-111015819944 | flake | flake (0.88), flake (0.84), flake (0.85), flake (0.91), flake (0.89) |
| 37084216484-111091037714 | flake | code (0.62), code (0.68), code (0.68), code (0.68), code (0.74) |
| 37085238561-111094045071 | code | flake (0.65), flake (0.74), flake (0.71), flake (0.68), flake (0.72) |
| 37085300954-111094230716 | flake | flake (0.59), flake (0.67), flake (0.57), flake (0.58), flake (0.56) |
| 37085694087-111095400294 | code | code (0.81), code (0.75), code (0.76), code (0.75), code (0.78) |
| 37085861836-111095910345 | flake | flake (0.75), flake (0.73), flake (0.74), flake (0.82), flake (0.80) |
| 37085939702-111096151080 | code | code (0.50), code (0.59), code (0.53), code (0.59), code (0.56) |
| 37093654139-111119060358 | flake | flake (0.74), flake (0.79), flake (0.71), flake (0.71), flake (0.72) |
| 37094184070-111120609717 | flake | flake (0.91), flake (0.88), flake (0.91), flake (0.89), flake (0.90) |
| 37397125048-112055629009 | flake | flake (0.96), flake (0.96), flake (0.96), flake (0.95), flake (0.95) |
| 37398104427-112058793002 | flake | flake (0.99), flake (0.98), flake (0.98), flake (0.98), flake (0.99) |
| 37400375015-112065996315 | other | other (1.00), other (1.00), other (1.00), other (1.00), other (1.00) |
| 37403130417-112074578370 | other | other (1.00), other (1.00), other (1.00), other (1.00), other (1.00) |
| 37408423009-112091126904 | flake | flake (0.87), flake (0.90), flake (0.90), flake (0.88), flake (0.91) |
| 37415941323-112114448376 | code | code (0.49), code (0.55), code (0.61), code (0.56), code (0.47) |
| 37417938982-112120635015 | code | code (0.94), code (0.92), code (0.92), code (0.93), code (0.94) |
| 37419922469-112126770376 | code | code (0.93), code (0.95), code (0.96), code (0.96), code (0.95) |
| 37488267737-112353920158 | code | code (0.89), code (0.89), code (0.88), code (0.89), code (0.91) |
| 37492236729-112367646139 | code | code (0.90), code (0.92), code (0.92), code (0.92), code (0.92) |
| 37493290696-112371263950 | code | code (0.92), code (0.91), code (0.90), code (0.89), code (0.89) |
| 37496077633-112380849332 | flake | flake (0.99), flake (0.98), flake (0.98), flake (0.98), flake (0.98) |
| 37497586325-112385991799 | flake | flake (1.00), flake (0.98), flake (0.99), flake (1.00), flake (1.00) |
| 37694384761-113042295900 | flake | flake (1.00), flake (1.00), flake (1.00), flake (0.99), flake (0.99) |
| 38336307513-115097058740 | env | code (0.81), code (0.81), code (0.81), code (0.81), code (0.80) |
| 38347156620-115131107123 | code | code (0.81), code (0.78), code (0.78), code (0.79), code (0.79) |
| 38514387350-115693976348 | code | flake (0.59), flake (0.65), flake (0.61), flake (0.58), flake (0.58) |
| 38592028412-115949092992 | code | code (0.80), code (0.77), code (0.76), code (0.78), code (0.76) |
| 38592906530-115961464864 | code | code (0.96), code (0.95), code (0.95), code (0.96), code (0.94) |
| 38651060212-116149669040 | code | code (0.68), code (0.62), code (0.66), code (0.64), code (0.56) |
| 38662038548-116185334070 | code | other (0.51), other (0.45), other (0.46), other (0.45), code (0.48) |
| 38662038548-116185334305 | code | flake (0.81), flake (0.83), flake (0.81), flake (0.83), flake (0.85) |
| 38665984160-116197945836 | flake | flake (0.95), flake (0.94), flake (0.95), flake (0.95), flake (0.95) |
| 38667742365-116203453112 | flake | flake (0.96), flake (0.96), flake (0.97), flake (0.96), flake (0.95) |
| 38667859999-116203812029 | env | env (0.78), env (0.83), env (0.77), env (0.80), env (0.81) |
| 38667859999-116203812095 | flake | flake (0.98), flake (0.98), flake (0.98), flake (0.98), flake (0.99) |
| 38671115520-116214218814 | env | env (0.89), env (0.89), env (0.92), env (0.89), env (0.89) |
| 38760833360-116511365575 | code | code (0.90), code (0.87), code (0.90), code (0.87), code (0.89) |
