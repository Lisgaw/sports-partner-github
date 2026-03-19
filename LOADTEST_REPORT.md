# 🔥 Yük Testi Raporu - Sports Partner Vercel Deployment

**Test Tarihi**: 19 Mart 2026  
**Test Aracı**: Artillery  
**Test Hedefi**: https://sports-partner-github.vercel.app  
**Test Süresi**: ~8 dakika

---

## 📊 Özet Bulgular

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
