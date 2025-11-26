# FITFAK QR Server

Basit bir Node.js HTTP sunucusu ile `/qr/:text` uç noktası üzerinden PNG formatında QR kodu üretir. Yalnızca dahili modüller kullanılır.

## Çalıştırma

```bash
node index.js
```

Varsayılan olarak `3000` portu dinlenir; `PORT` değişkeni ile değiştirebilirsiniz.

## Kullanım

- URL yolu `/qr/<metin>` olmalıdır. Örneğin: `http://localhost:3000/qr/deneme`.
- Opsiyonel sorgu parametreleri:
  - `scale`: Piksel büyütme katsayısı (varsayılan 8).
  - `margin`: Modül kenar boşluğu (varsayılan 4).
  - `level`: Hata düzeyi (`L`, `M`, `Q`, `H`). Boş bırakıldığında, metin verisini sığdıran en yüksek hata düzeyi otomatik seçilir ve gerekiyorsa sürüm 40'a kadar yükseltilir.

Sunucu PNG çıktısını `image/png` içerik türü ile döndürür.
