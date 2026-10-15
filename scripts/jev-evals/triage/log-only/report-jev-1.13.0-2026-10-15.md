# Jev eval: triage, jev-1.13.0, 2026-10-15

**Result:** FAIL on the bar.

- FAIL accuracy: 72.0% (bar 85.0%)
- pass safety: zero misses from floor 0.9
- pass cost: $0.000070 per case (bar $0.001)
- pass latency: p95 143 ms (bar 3000 ms)

Calls: 250; answered 250; right 180; skipped 0; errors 0.

## 5 runs of the same set, pooled below

| run | accuracy | misses | lowest floor with none |
|---|---|---|---|
| 1 | 72.0% | 2 | 0.9 |
| 2 | 72.0% | 2 | 0.8 |
| 3 | 72.0% | 2 | 0.9 |
| 4 | 72.0% | 2 | 0.8 |
| 5 | 72.0% | 2 | 0.8 |

## Confusion (rows: truth, columns: Jev)

| truth | flake | code | env | other |
|---|---|---|---|---|
| flake | 60 | 50 | 0 | 0 |
| code | 10 | 95 | 0 | 5 |
| env | 0 | 5 | 15 | 0 |
| other | 0 | 0 | 0 | 10 |

## Accuracy by confidence

| confidence | cases | right | accuracy |
|---|---|---|---|
| 0.00-0.50 | 0 | 0 | - |
| 0.50-0.70 | 40 | 10 | 25.0% |
| 0.70-0.80 | 27 | 19 | 70.4% |
| 0.80-0.90 | 93 | 65 | 69.9% |
| 0.90-1.00 | 90 | 86 | 95.6% |

## Safety misses: code labelled flake (a real failure called a flake: a rerun would hide it)

- 37085939702-111096151080 at 0.800
- 38662038548-116185334305 at 0.710
- 37085939702-111096151080 at 0.760
- 38662038548-116185334305 at 0.670
- 37085939702-111096151080 at 0.810
- 38662038548-116185334305 at 0.730
- 37085939702-111096151080 at 0.740
- 38662038548-116185334305 at 0.660
- 37085939702-111096151080 at 0.790
- 38662038548-116185334305 at 0.710

| floor | picks kept | right | accuracy kept | misses |
|---|---|---|---|---|
| 0 | 250 | 180 | 72.0% | 10 |
| 0.5 | 250 | 180 | 72.0% | 10 |
| 0.6 | 245 | 176 | 71.8% | 10 |
| 0.7 | 210 | 170 | 81.0% | 8 |
| 0.8 | 183 | 151 | 82.5% | 2 |
| 0.9 | 90 | 86 | 95.6% | 0 |
| 0.95 | 61 | 61 | 100.0% | 0 |

Lowest floor with zero misses: 0.9.

## Cost and speed

- Input tokens: 417715 (1671 per case)
- Cost: $0.017544 total, $0.000070 per case
- Latency: p50 101 ms, p95 143 ms

## Per case

| case | truth | Jev, each run (confidence) |
|---|---|---|
| 36449488488-109020262476 | code | code (0.89), code (0.88), code (0.88), code (0.87), code (0.88) |
| 36453814343-109034918693 | code | code (0.90), code (0.88), code (0.91), code (0.89), code (0.89) |
| 36510316871-109220752013 | code | code (0.85), code (0.85), code (0.85), code (0.84), code (0.85) |
| 36510510736-109221351319 | code | code (0.87), code (0.85), code (0.87), code (0.86), code (0.83) |
| 36641964490-109656068890 | code | code (0.89), code (0.92), code (0.90), code (0.87), code (0.86) |
| 36648366738-109676531404 | env | env (0.53), env (0.56), env (0.63), env (0.61), env (0.56) |
| 36752695653-110015041544 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 36892672737-110471887246 | flake | flake (0.98), flake (0.96), flake (0.96), flake (0.96), flake (0.97) |
| 36899639408-110495289934 | flake | flake (0.95), flake (0.95), flake (0.95), flake (0.96), flake (0.95) |
| 36919826164-110562795958 | flake | flake (0.91), flake (0.92), flake (0.93), flake (0.91), flake (0.91) |
| 37029162141-110911341906 | flake | code (0.68), code (0.69), code (0.70), code (0.59), code (0.69) |
| 37032726331-110923294592 | flake | code (0.86), code (0.85), code (0.86), code (0.87), code (0.85) |
| 37034561600-110929431408 | flake | code (0.67), code (0.65), code (0.64), code (0.65), code (0.67) |
| 37060542304-111015819944 | flake | code (0.64), code (0.66), code (0.64), code (0.65), code (0.65) |
| 37084216484-111091037714 | flake | code (0.91), code (0.87), code (0.86), code (0.90), code (0.91) |
| 37085238561-111094045071 | code | code (0.74), code (0.81), code (0.78), code (0.80), code (0.79) |
| 37085300954-111094230716 | flake | code (0.87), code (0.88), code (0.87), code (0.88), code (0.87) |
| 37085694087-111095400294 | code | code (0.78), code (0.75), code (0.73), code (0.73), code (0.78) |
| 37085861836-111095910345 | flake | code (0.89), code (0.86), code (0.89), code (0.89), code (0.89) |
| 37085939702-111096151080 | code | flake (0.80), flake (0.76), flake (0.81), flake (0.74), flake (0.79) |
| 37093654139-111119060358 | flake | code (0.89), code (0.89), code (0.89), code (0.89), code (0.92) |
| 37094184070-111120609717 | flake | code (0.69), code (0.60), code (0.68), code (0.65), code (0.63) |
| 37397125048-112055629009 | flake | flake (0.99), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 37398104427-112058793002 | flake | flake (0.97), flake (0.97), flake (0.97), flake (0.97), flake (0.96) |
| 37400375015-112065996315 | other | other (1.00), other (1.00), other (1.00), other (1.00), other (1.00) |
| 37403130417-112074578370 | other | other (1.00), other (1.00), other (1.00), other (1.00), other (1.00) |
| 37408423009-112091126904 | flake | code (0.62), code (0.61), code (0.60), code (0.62), code (0.65) |
| 37415941323-112114448376 | code | code (0.87), code (0.87), code (0.88), code (0.89), code (0.86) |
| 37417938982-112120635015 | code | code (0.86), code (0.88), code (0.87), code (0.89), code (0.88) |
| 37419922469-112126770376 | code | code (0.84), code (0.81), code (0.79), code (0.84), code (0.83) |
| 37488267737-112353920158 | code | code (0.92), code (0.93), code (0.92), code (0.95), code (0.91) |
| 37492236729-112367646139 | code | code (0.92), code (0.92), code (0.94), code (0.93), code (0.91) |
| 37493290696-112371263950 | code | code (0.93), code (0.93), code (0.92), code (0.94), code (0.92) |
| 37496077633-112380849332 | flake | flake (0.99), flake (0.99), flake (1.00), flake (0.99), flake (1.00) |
| 37497586325-112385991799 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 37694384761-113042295900 | flake | flake (1.00), flake (1.00), flake (1.00), flake (1.00), flake (1.00) |
| 38336307513-115097058740 | env | code (0.65), code (0.70), code (0.64), code (0.66), code (0.66) |
| 38347156620-115131107123 | code | code (0.84), code (0.84), code (0.82), code (0.84), code (0.83) |
| 38514387350-115693976348 | code | code (0.92), code (0.89), code (0.89), code (0.88), code (0.90) |
| 38592028412-115949092992 | code | code (0.79), code (0.79), code (0.79), code (0.80), code (0.79) |
| 38592906530-115961464864 | code | code (0.78), code (0.73), code (0.80), code (0.80), code (0.80) |
| 38651060212-116149669040 | code | code (0.61), code (0.63), code (0.61), code (0.60), code (0.58) |
| 38662038548-116185334070 | code | other (0.84), other (0.83), other (0.85), other (0.85), other (0.83) |
| 38662038548-116185334305 | code | flake (0.71), flake (0.67), flake (0.73), flake (0.66), flake (0.71) |
| 38665984160-116197945836 | flake | flake (0.88), flake (0.87), flake (0.88), flake (0.88), flake (0.83) |
| 38667742365-116203453112 | flake | flake (0.81), flake (0.85), flake (0.83), flake (0.87), flake (0.84) |
| 38667859999-116203812029 | env | env (0.99), env (0.99), env (0.98), env (0.99), env (0.98) |
| 38667859999-116203812095 | flake | flake (0.87), flake (0.86), flake (0.88), flake (0.88), flake (0.87) |
| 38671115520-116214218814 | env | env (1.00), env (1.00), env (1.00), env (1.00), env (1.00) |
| 38760833360-116511365575 | code | code (0.76), code (0.78), code (0.80), code (0.79), code (0.79) |
