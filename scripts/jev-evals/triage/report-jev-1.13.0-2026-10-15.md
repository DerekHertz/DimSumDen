# Jev eval: triage, jev-1.13.0, 2026-10-15

**Result:** FAIL on the bar.

- FAIL accuracy: 82.8% (bar 85.0%)
- pass safety: zero misses from floor 0.8
- pass cost: $0.000072 per case (bar $0.001)
- pass latency: p95 135 ms (bar 3000 ms)

Calls: 250; answered 250; right 207; skipped 0; errors 0.

## 5 runs of the same set, pooled below

| run | accuracy | misses | lowest floor with none |
|---|---|---|---|
| 1 | 84.0% | 3 | 0.8 |
| 2 | 84.0% | 3 | 0.7 |
| 3 | 80.0% | 3 | 0.7 |
| 4 | 82.0% | 3 | 0.7 |
| 5 | 84.0% | 3 | 0.8 |

## Confusion (rows: truth, columns: Jev)

| truth | flake | code | env | other |
|---|---|---|---|---|
| flake | 92 | 18 | 0 | 0 |
| code | 15 | 90 | 0 | 5 |
| env | 0 | 5 | 15 | 0 |
| other | 0 | 0 | 0 | 10 |

## Accuracy by confidence

| confidence | cases | right | accuracy |
|---|---|---|---|
| 0.00-0.50 | 8 | 3 | 37.5% |
| 0.50-0.70 | 55 | 25 | 45.5% |
| 0.70-0.80 | 48 | 43 | 89.6% |
| 0.80-0.90 | 34 | 31 | 91.2% |
| 0.90-1.00 | 105 | 105 | 100.0% |

## Safety misses: code labelled flake (a real failure called a flake: a rerun would hide it)

- 37085238561-111094045071 at 0.620
- 38514387350-115693976348 at 0.570
- 38662038548-116185334305 at 0.700
- 37085238561-111094045071 at 0.570
- 38514387350-115693976348 at 0.510
- 38662038548-116185334305 at 0.630
- 37085238561-111094045071 at 0.550
- 38514387350-115693976348 at 0.550
- 38662038548-116185334305 at 0.650
- 37085238561-111094045071 at 0.580
- 38514387350-115693976348 at 0.570
- 38662038548-116185334305 at 0.630
- 37085238561-111094045071 at 0.570
- 38514387350-115693976348 at 0.570
- 38662038548-116185334305 at 0.750

| floor | picks kept | right | accuracy kept | misses |
|---|---|---|---|---|
| 0 | 250 | 207 | 82.8% | 15 |
| 0.5 | 242 | 204 | 84.3% | 15 |
| 0.6 | 214 | 191 | 89.3% | 6 |
| 0.7 | 187 | 179 | 95.7% | 2 |
| 0.8 | 139 | 136 | 97.8% | 0 |
| 0.9 | 105 | 105 | 100.0% | 0 |
| 0.95 | 98 | 98 | 100.0% | 0 |

Lowest floor with zero misses: 0.8.

## Cost and speed

- Input tokens: 430305 (1721 per case)
- Cost: $0.018073 total, $0.000072 per case
- Latency: p50 92 ms, p95 135 ms

## Per case

| case | truth | Jev, each run (confidence) |
|---|---|---|
| 36449488488-109020262476 | code | code (0.85), code (0.87), code (0.86), code (0.86), code (0.88) |
| 36453814343-109034918693 | code | code (0.78), code (0.76), code (0.78), code (0.77), code (0.78) |
| 36510316871-109220752013 | code | code (0.74), code (0.75), code (0.77), code (0.73), code (0.75) |
| 36510510736-109221351319 | code | code (0.72), code (0.73), code (0.77), code (0.67), code (0.67) |
| 36641964490-109656068890 | code | code (0.84), code (0.87), code (0.86), code (0.86), code (0.81) |
| 36648366738-109676531404 | env | env (0.63), env (0.63), env (0.60), env (0.59), env (0.59) |
| 36752695653-110015041544 | flake | flake (0.99), flake (0.99), flake (0.99), flake (0.99), flake (0.99) |
| 36892672737-110471887246 | flake | flake (0.96), flake (0.96), flake (0.96), flake (0.95), flake (0.96) |
| 36899639408-110495289934 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 36919826164-110562795958 | flake | flake (0.99), flake (0.99), flake (0.99), flake (0.99), flake (0.99) |
| 37029162141-110911341906 | flake | code (0.58), code (0.47), code (0.52), code (0.54), code (0.44) |
| 37032726331-110923294592 | flake | code (0.77), code (0.82), code (0.74), code (0.82), code (0.85) |
| 37034561600-110929431408 | flake | flake (0.50), flake (0.56), code (0.41), flake (0.42), flake (0.50) |
| 37060542304-111015819944 | flake | flake (0.78), flake (0.79), flake (0.76), flake (0.82), flake (0.81) |
| 37084216484-111091037714 | flake | code (0.69), code (0.71), code (0.66), code (0.64), code (0.65) |
| 37085238561-111094045071 | code | flake (0.62), flake (0.57), flake (0.55), flake (0.58), flake (0.57) |
| 37085300954-111094230716 | flake | flake (0.43), flake (0.52), code (0.49), code (0.45), flake (0.45) |
| 37085694087-111095400294 | code | code (0.87), code (0.82), code (0.85), code (0.85), code (0.87) |
| 37085861836-111095910345 | flake | flake (0.71), flake (0.68), flake (0.71), flake (0.69), flake (0.68) |
| 37085939702-111096151080 | code | code (0.71), code (0.76), code (0.72), code (0.74), code (0.73) |
| 37093654139-111119060358 | flake | flake (0.69), flake (0.74), flake (0.73), flake (0.77), flake (0.76) |
| 37094184070-111120609717 | flake | flake (0.87), flake (0.86), flake (0.88), flake (0.85), flake (0.86) |
| 37397125048-112055629009 | flake | flake (0.98), flake (0.97), flake (0.97), flake (0.98), flake (0.98) |
| 37398104427-112058793002 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 37400375015-112065996315 | other | other (1.00), other (1.00), other (1.00), other (1.00), other (1.00) |
| 37403130417-112074578370 | other | other (1.00), other (1.00), other (1.00), other (1.00), other (1.00) |
| 37408423009-112091126904 | flake | flake (0.82), flake (0.89), flake (0.88), flake (0.79), flake (0.87) |
| 37415941323-112114448376 | code | code (0.59), code (0.55), code (0.54), code (0.63), code (0.56) |
| 37417938982-112120635015 | code | code (1.00), code (0.99), code (1.00), code (1.00), code (1.00) |
| 37419922469-112126770376 | code | code (1.00), code (1.00), code (1.00), code (1.00), code (0.99) |
| 37488267737-112353920158 | code | code (0.98), code (0.98), code (0.99), code (0.98), code (0.99) |
| 37492236729-112367646139 | code | code (0.99), code (0.99), code (0.99), code (0.99), code (0.99) |
| 37493290696-112371263950 | code | code (0.98), code (0.99), code (0.98), code (0.99), code (0.99) |
| 37496077633-112380849332 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 37497586325-112385991799 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 37694384761-113042295900 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 38336307513-115097058740 | env | code (0.69), code (0.69), code (0.67), code (0.67), code (0.69) |
| 38347156620-115131107123 | code | code (0.73), code (0.70), code (0.75), code (0.74), code (0.70) |
| 38514387350-115693976348 | code | flake (0.57), flake (0.51), flake (0.55), flake (0.57), flake (0.57) |
| 38592028412-115949092992 | code | code (0.72), code (0.74), code (0.73), code (0.75), code (0.72) |
| 38592906530-115961464864 | code | code (0.98), code (0.98), code (0.99), code (0.99), code (0.99) |
| 38651060212-116149669040 | code | code (0.59), code (0.60), code (0.58), code (0.60), code (0.55) |
| 38662038548-116185334070 | code | other (0.58), other (0.57), other (0.55), other (0.61), other (0.60) |
| 38662038548-116185334305 | code | flake (0.70), flake (0.63), flake (0.65), flake (0.63), flake (0.75) |
| 38665984160-116197945836 | flake | flake (0.94), flake (0.94), flake (0.95), flake (0.94), flake (0.93) |
| 38667742365-116203453112 | flake | flake (0.95), flake (0.96), flake (0.95), flake (0.96), flake (0.94) |
| 38667859999-116203812029 | env | env (0.94), env (0.94), env (0.96), env (0.95), env (0.95) |
| 38667859999-116203812095 | flake | flake (0.99), flake (0.99), flake (0.98), flake (0.98), flake (0.99) |
| 38671115520-116214218814 | env | env (0.79), env (0.80), env (0.77), env (0.83), env (0.79) |
| 38760833360-116511365575 | code | code (0.79), code (0.77), code (0.84), code (0.82), code (0.81) |
