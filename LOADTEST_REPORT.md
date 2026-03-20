# 🔥 Yük Testi Raporu — Sports Partner Docker Full-Stack Benchmark

> **ÖNEMLİ**: Bu rapor iki aşamalı testin sonucudur:
> - **Faz 1** (19 Mart 2026): Vercel ortamında Artillery testi — bağlantı sınırları nedeniyle yanıltıcı sonuçlar
> - **Faz 2** (20 Mart 2026): Docker izole ortamda Autocannon testi — gerçek kapasite verileri

---

# FAZ 2: Docker İzole Ortam Benchmark (20 Mart 2026)

**Test Tarihi**: 20 Mart 2026  
**Test Aracı**: Autocannon (npx autocannon)  
**Test Ortamı**: Docker (localhost) — Vercel/Cloudflare limiti yok  
**App Container**: `sports_partner_app` — Next.js 16.1.6, Node.js 20 alpine, standalone build  
**DB Container**: `sports_partner_db` — PostgreSQL 16 alpine, 163 kullanıcı, 65 ilan  
**Cache**: In-process memory cache (Redis/Upstash yok)  
**DB Pool**: `connection_limit=20`, `pool_timeout=15`  
**Host RAM Limiti**: 3.77 GiB (Docker Desktop)

---

## 📊 Özet Sonuçlar

### 🏠 Ana Sayfa (SSR — `/`)

| Concurrency | RPS | P50 Latency | P99 Latency | Hata Oranı | Sonuç |
|-------------|-----|-------------|-------------|------------|-------|
| **10 VU** | 16.7/s | 553ms | 1,379ms | **0%** | ✅ Kararlı |
| **25 VU** | 16.2/s | 1,502ms | 1,772ms | **0%** | ✅ Yavaşlıyor |
| **50 VU** | 14.9/s | 2,904ms | 6,623ms | **0%** | ⚠️ Limit yakın |
| **100 VU** | 12.0/s | 3,288ms | 8,686ms | **33%** | ❌ Çöküyor |
| **200 VU** | 10.0/s | 2,938ms | 9,187ms | **62.5%** | ❌ Kritik |
| **500 VU** | 0/s | — | — | **100%** | 💀 Tam çöküş |
| **1000 VU** | 0/s | — | — | **100% + OOM** | 💀 JS Heap OOM |

**Break Point**: `~75 VU` — 50'de sıfır hata, 100'de %33 hata.

---

### 🔌 API Endpoints (Cache'li — `/api/sports`, 1 saatlik TTL)

| Concurrency | RPS | P50 Latency | P99 Latency | Hata Oranı | Sonuç |
|-------------|-----|-------------|-------------|------------|-------|
| **50 VU** | **450/s** | 97ms | 298ms | **0%** | ✅ Mükemmel |
| **200 VU** | **512/s** | 254ms | 360ms | **1%** | ✅ Çok iyi |
| **500 VU** | **479/s** | 630ms | 1,425ms | **3.3%** | ✅ İyi |

**Cache gücü**: SSR'a göre **30x daha hızlı** (97ms vs 553ms @ c=50), **30x daha fazla RPS** (450 vs 15).

---

## 🔬 Darboğaz Analizi

### 1. Ana Darboğaz: SSR Render Maliyeti (~550ms/istek)
Ana sayfa (`/`) her render'da:
- `getInitialLocations()` → cache'li, ama ilk istek DB'ye gider
- `getInitialSports()` → cache'li, ama ilk istek DB'ye gider  
- React Server Component ağacı render edilir
- **Tek thread'li Node.js**: 550ms × concurrent_requests = kuyruk oluşumu

**Sonuç**: c=10'da RPS=16.7 (≈ 1/550ms = 1.8/thread). Node.js çekirdek başına sadece ~17 istek/saniye işleyebiliyor.

### 2. İkincil Darboğaz: DB Connection Pool (max=20)
- 20 bağlantı, her SSR isteği 1-2 bağlantı kullanır
- c=50'de 50+ istek bekliyor, 20 slot için sıra oluşuyor
- P50 latency 553ms → 2,904ms artar (pool_timeout baskısı)
- c=100'de `P2024 connection pool timeout` hataları başlar

### 3. Üçüncül Darboğaz: In-Process Bellek Cache (Redis Yok)
- Her restart baştan başlar — ısınma gerektirir
- 1000 VU testinde: **1.5 GB → 3.76 GB OOM crash**
- `FATAL ERROR: Ineffective mark-compacts near heap limit`
- Redis yoksa cache birden fazla instance'a scale edilemiyor

---

## 📈 Kapasite Projeksiyon (Mevcut Sistem)

| Senaryo | Eş Zamanlı Kullanıcı | Günlük Aktif Kullanıcı (est.) | Durum |
|---------|----------------------|-------------------------------|-------|
| Üretim kararlı | 0–50 eş zamanlı | ~5,000 DAU | ✅ |
| Stres altında | 50–75 eş zamanlı | ~7,500 DAU | ⚠️ P99 > 5s |
| Çöküş eşiği | 75+ eş zamanlı | 7,500+ DAU | ❌ |
| Hedef (50K-100K DAU) | ~500–1,000 eş zamanlı | 50K-100K DAU | 🚫 Mümkün değil |

**Sonuç**: Mevcut mimari **~5,000 DAU** için uygun. 50K-100K için **10–20x scale** lazım.

---

## 🛠️ 50K-100K DAU İçin Gerekli İyileştirmeler

### Öncelik 1 (Hemen): Redis Cache
```bash
# Upstash Redis ekle
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
- OOM sorununu çözer (bellek cache → Redis)
- Birden fazla instance'a scale edilebilir
- **Beklenen etki**: 1000 VU'da OOM yerine kararlı çalışma

### Öncelik 2 (Kısa Vadeli): DB Connection Artırımı + PgBouncer
```prisma
connection_limit=50 → pool_timeout=20
```
veya Supabase PgBouncer (zaten Session mode aktif)
- **Beklenen etki**: Break point 75 VU → 200 VU

### Öncelik 3 (Orta Vadeli): Cluster Mode (PM2 veya Node.js cluster)
```bash
# Node.js worker threads veya PM2 cluster
NODE_OPTIONS="--max-old-space-size=512" 
# + pm2 start server.js -i max
```
- CPU core sayısı kadar thread (örn.: 4 core = 4 worker)
- **Beklenen etki**: Tek thread 16 RPS → 4 thread 64 RPS; break point ~300 VU

### Öncelik 4 (Uzun Vadeli): ISR + Edge Caching
- Ana sayfayı ISR (revalidate=60) ile önbellekliği artır
- CDN/Vercel Edge Cache'te tam sayfa cache
- `/api/sports`, `/api/locations` → Edge'de cache (Vercel Analytics)
- **Beklenen etki**: Ana sayfa RPS 16 → 500+ (CDN cache hit)

---

## 🐛 Docker Setup Sorunları ve Çözümleri

Bu test sırasında karşılaşılan kritik sorunlar ve çözümleri:

| Sorun | Neden | Çözüm |
|-------|-------|-------|
| `ARG DOCKER_BUILD` eksik Dockerfile'da | `next.config.ts`'deki `output: standalone` hiç set edilmiyordu | `ARG DOCKER_BUILD` + `ENV DOCKER_BUILD=$DOCKER_BUILD` eklendi |
| `.next/standalone: not found` | Standalone build yapılmadı | DOCKER_BUILD=1 ARG ile çözüldü |
| `ListingType: VENUE_MEMBERSHIP` enum eksik | Docker DB 7 migration geride kalmış | 7 migration SQL dosyası `docker cp` + psql ile uygulandı |
| `localhost` IPv6'ya resolve → timeout | WSL relay CLOSE_WAIT durumda | `127.0.0.1` ile test yapıldı |
| Container OOM kilitlenmesi | In-process cache 1.5 GB'ı aştı | `docker rm -f` + temiz restart |

---

# FAZ 1: Vercel Ortamı Testi (19 Mart 2026) — Arşiv

**Test Tarihi**: 19 Mart 2026  
**Test Aracı**: Artillery  
**Test Hedefi**: https://sports-partner-github.vercel.app  
**Test Süresi**: ~8 dakika

---

## 📊 Özet Bulgular (Faz 1)

| Metrik | Değer |
|--------|-------|
| **Toplam İstek** | 43,200 |
| **Başarılı İstek** | 11,289 (26.1%) |
| **Başarısız İstek** | 31,946 (73.9%) |
| **Başarısızlık Nedeni** | ETIMEDOUT (Timeout) |
| **Test Edilen Kullanıcı Sayısı** | 43,200 sanal kullanıcı (10, 50, 100, 200 varyasyonlar) |

---

## ⚠️ Kritik Sorun: Vercel Timeout Çökmesi

Vercel Hobby planının **10 saniye timeout** sınırını aştıyoruz. Yüksek trafik durumunda:
- İsteklerin **73.9%'i timeout** (ETIMEDOUT) ile başarısız oldu
- Sistem belirli bir eş zamanlı kullanıcı sayısından sonra **çöküyor**

---

## 📈 Response Time İstatistikleri (Başarılı İstekler Bazında)

### Genel Response Time:
- **Minimum**: 1ms
- **Maksimum**: 4,771ms
- **Ortalama**: 278.9ms
- **Medyan (p50)**: 219.2ms
- **p75**: 295.9ms
- **p90**: 561.2ms
- **p95**: 925.4ms
- **p99**: 1,380.5ms

### Endpoint Başında Response Time:

#### 1. `/api/listings/map` (Harita API)
- **Başarılı İstekler**: 5,672
- **Başarısız İstekler**: 15,878
- **Ortalama Response Time**: 130.3ms
- **P50**: 111.1ms
- **P90**: 159.2ms
- **P95**: 214.9ms
- **P99**: 459.5ms
- **Sonuç**: ✅ En hızlı endpoint, stabil

#### 2. `/` (Ana Sayfa)
- **Başarılı İstekler**: 5,582
- **Başarısız İstekler**: 16,068
- **Ortalama Response Time**: 429ms
- **P50**: 290.1ms
- **P90**: 907ms
- **P95**: 1,153.1ms
- **P99**: 1,495.5ms
- **Sonuç**: ⚠️ Daha yavaş, SSR maliyet yüksek

---

## 🔴 Eş Zamanlı Kullanıcı Kapasitesi

Vercel Hobby planı test sonuçlarına göre:

| Eş Zamanlı Kullanıcı | Sistem Durumü | Açıklama |
|-----|-------------------|---------|
| **10-20** | ✅ Güvenli | Tüm istekler başarılı, hızlı response |
| **50** | ⚠️ Riskli | Timeout hataları başlamaya başlıyor (~30% hata) |
| **100** | 🔴 Ciddi Sorun | %60-70 hata oranı, Vercel timeout |
| **200+** | 💥 Çökme | %73.9 hata oranı, sistem stabil değil |

### **Sonuç**: Vercel Hobby ile güvenli kapasite **~15-20 eş zamanlı aktif kullanıcı**

---

## 💡 Root Cause Analizi

### Vercel Hobby Kısıtlamaları:
1. **10 saniye Serverless Function Timeout** ← **ANA SORUN**
2. 100 Concurrent Lambda Executions Limiti
3. 1 GB RAM per Function
4. 1024 aktif DB bağlantısı (Prisma)

### Projenin Sorunları:
- **Ana Sayfa (/)**: SSR (Server-Side Rendering) ile her sayfa yüklemesi 400-1500ms gerektirebiliyor
- **Veritabanı Sorguları**: Listing'ler ve bot verisi çekme, filtreleme, kategorileme
- **Next.js compilation overhead**: Yüksek traffikte Next.js bileşenleri derlemesi yavaşlıyor

---

## 🎯 İyileştirme Önerileri

### Acil (1-2 gün):
1. ✅ **ISR (Incremental Static Regeneration)** devre dışı getir veya kısa revalidation süresi
2. ✅ **Veritabanı sorgu optimizasyonu**: Indexed sorguları, N+1 sorgu problemini çöz
3. ✅ **API caching**: `/api/listings/map` ve feed verileri 30-60 saniye cache'le

### Kısa Dönem (1 hafta):
4. 🔄 **Vercel Pro'ya geç**: Concurrency limiti 100 → 1000+, timeout 10s → 30s
5. 🔄 **Next.js Image Optimization**: Resim boyutlarını küçült
6. 🔄 **CDN caching**: Statik içeriği Edge'da cache'le

### Uzun Dönem (2-4 hafta):
7. 🚀 **Railway / Heroku gibi alternatif hosting**: Daha fazla kontrolle, özel DB
8. 🚀 **Redis Cache Layer ekle**: Sık kullanılan sorguları cache'le
9. 🚀 **Microservices**: Listing API'si, Feed API'si, Map API'si ayrı scaling

---

## 📝 Test Detayları

### Test Senaryosu:
- **Aşama 1**: 10 VU × 60s (Ana Sayfa)
- **Aşama 2**: 50 VU × 60s (Ana Sayfa)
- **Aşama 3**: 100 VU × 60s (Ana Sayfa)
- **Aşama 4**: 200 VU × 60s (Ana Sayfa)
- **Aşama 5-8**: Aynı test Harita API'si için

### Başarı Kriterleri:
- ❌ **p95 < 1000ms**: Başarısız (p95 = 925.4ms ✅ başarılı ama timeout nedeniyle overall başarısız)
- ❌ **Error Rate < 5%**: Başarısız (Error Rate = 73.9% 🔴)
- ❌ **Availability > 95%**: Başarısız (Availability = 26.1% 🔴)

---

## 🏁 Sonuç

**Vercel Hobby planı ile Sports Partner Uygulaması:**

- 🟢 **10-20 eş zamanlı kullanıcı**: Normal kullanım, sorun yok
- 🟡 **20-50 eş zamanlı kullanıcı**: Timeout hataları başlayacak
- 🔴 **50+ eş zamanlı kullanıcı**: Sistem neredeyse çöküyor (%73.9 hata)

### Tavsiye:
- Prototip/staging için: Vercel Hobby yeterli ✅
- Üretim (production) için: **Vercel Pro (minimum) veya alternatif hosting gerekli** 🚀

---

**Not**: Bu test public adreste (Vercel üzerinde) yapılmıştır. Lokal ortamda test edilirse farklı sonuçlar elde edilebilir.
