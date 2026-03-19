# Yeni Saglik Raporu - 19 Mart 2026

## Ozet

- Yeni eklenen 6 test dosyasi toplam 22 test ile gecti.
- Degistirilen dosyalarda diagnostics hatasi yok.
- Uygulama seviyesinde iki yeni hata siniri eklendi: route-level ve global fallback.
- `/api/listings/map`, `/api/feed` ve `/api/listings` icin cache header ve stale fallback mantigi eklendi.
- Local production ortaminda yeni header'lar dogrulandi.
- Public Vercel hedefinde yeni cache header'lari henuz gorunmuyor; yani bu degisiklikler uretimde aktif degil.

## Test ve Dayaniklilik Durumu

Gecen test dosyalari:

- `src/__tests__/localized-ui.test.ts`
- `src/__tests__/toast.test.ts`
- `src/__tests__/storage.test.ts`
- `src/__tests__/api-auth-register.integration.test.ts`
- `src/__tests__/api-listings-map.integration.test.ts`
- `src/__tests__/api-feed.integration.test.ts`

Sonuc:

- 6 test dosyasi gecti
- 22 test gecti
- Degistirilen dosyalarda ek hata yok

## Cache Header Dogrulamasi

Local production cevap header'lari:

| Endpoint | Cache-Control | Durum |
|---|---|---|
| `/api/listings/map` | `public, s-maxage=45, stale-while-revalidate=180` | Beklenen cache header donuyor |
| `/api/feed?page=1` | `private, max-age=20, stale-while-revalidate=60` | Beklenen private cache header donuyor |

Public Vercel endpoint durumu:

| Endpoint | Cache-Control | Yorum |
|---|---|---|
| `https://sports-partner-github.vercel.app/api/listings/map` | `public, max-age=0, must-revalidate` | Yeni cache surumu uretime cikmamis |

## Benchmark Sonuclari

Not:

- Asagidaki yeni benchmark current code icin local production origin uzerinde alindi.
- Eski `LOADTEST_REPORT.md` ise public Vercel uzerinde alinmis tarihsel rapordur.
- Bu nedenle sayilar bire bir ayni ortam karsilastirmasi degildir.
- Buna ragmen su iki soruya net cevap verir:
  - Yeni kod cache header'larini dogru donuyor mu? Evet.
  - 100K hedefi icin bugun yeterli miyiz? Hayir.

### Tarihsel Baz: Eski Vercel Raporu

| Endpoint | Ortam | Ortalama | p95 | Timeout Orani |
|---|---|---:|---:|---:|
| `/api/listings/map` | Public Vercel | 130.3 ms | 214.9 ms | 73.7% |
| `/api/feed` | Public Vercel | Yok | Yok | Yok |

### Yeni Benchmark: Current Local Production Origin

#### `/api/listings/map`

| Concurrency | Basari | Timeout | Ortalama | p95 |
|---|---:|---:|---:|---:|
| 10 | 100.0% | 0.0% | 319.0 ms | 328.5 ms |
| 50 | 100.0% | 0.0% | 890.3 ms | 1057.5 ms |
| 100 | 100.0% | 0.0% | 1665.6 ms | 1832.2 ms |
| 200 | 100.0% | 0.0% | 3123.9 ms | 3639.1 ms |

#### `/api/feed?page=1`

| Concurrency | Basari | Timeout | Ortalama | p95 |
|---|---:|---:|---:|---:|
| 10 | 100.0% | 0.0% | 2216.5 ms | 2682.6 ms |
| 50 | 100.0% | 0.0% | 6167.3 ms | 7372.3 ms |
| 100 | 28.6% | 71.4% | 8283.2 ms | 9769.9 ms |
| 200 | 2.4% | 97.6% | 7456.1 ms | 7652.5 ms |

## Yorum

### 1. Map endpointinde ne degisti?

- Kod seviyesi olarak cache header ve stale fallback eklendi.
- Local benchmark'ta timeout oraninin sifir olmasi olumlu.
- Ancak local ortamda shared cache backend aktif olmadigi icin response time dususu gormedik.
- Dolayisiyla "cache sonrasi hiz kazanci" uretim-benzeri ortamda henuz kanitlanmis degil.

### 2. Feed endpointinde ne degisti?

- Private cache header ve stale fallback eklendi.
- Authenticated endpoint oldugu icin bu rota map kadar edge-cache dostu degil.
- 100 concurrency ve ustunde timeout oranlari cok yuksek kaldigi icin asil bottleneck feed tarafinda.

### 3. 100K kullanici icin ne kadar haziriz?

Mevcut durum:

- Fonksiyonel saglamlik: belirgin bicimde daha iyi
- Test korumasi: belirgin bicimde daha iyi
- UI hata toleransi: daha iyi
- Uretim olcek hazirligi: henuz yetersiz

Kisa karar:

- Map: mantik hazir, uretimde cache aktifken yeniden benchmark gerekiyor
- Feed: bugunku haliyle 100K hedefi icin hazir degil

## Bir Sonraki Kritik Adim

Tek kritik adim:

`/api/feed` rotasini request-time hesaplama modelinden cikarip, Redis-backed veya precomputed feed snapshot modeline tasimak.

Neden:

- Public map endpointi shared cache ile toparlanabilir.
- Ama personalized feed, her istekte kullaniciya ozgu DB taramasi yaptigi surece 100K hedefinde dar bogaz olmaya devam eder.
- Bu rota icin cache tek basina header degil, veri modeli ve invalidation stratejisi gerektiriyor.

Pratik alt adimlar:

1. Feed sonucunu user bazli Redis key'lerinde materialize et
2. Yeni listing/follow/sport degisiminde hedefli invalidation yap
3. Feed sorgusunu on-demand join yerine precomputed candidate set ile calistir
4. Bu surumu production-benzeri ortamda ayni benchmark ile tekrar olc
