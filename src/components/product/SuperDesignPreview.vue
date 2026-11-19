<script setup>
import { onMounted } from 'vue'

// Load external scripts on mount
onMounted(() => {
  // Load Iconify
  if (!document.querySelector('script[src="https://code.iconify.design"]')) {
    const ic = document.createElement('script')
    ic.src = 'https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js'
    document.head.appendChild(ic)
  }
  // Load Google Fonts
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700&display=swap'
    document.head.appendChild(link)
  }
})

</script>

<!-- View transition config -->
<style>
  @view-transition { navigation: auto; }
</style>

<style>
  body {
    font-family: 'Archivo', sans-serif;
    background-color: #0b1120;
    -webkit-tap-highlight-color: transparent;
  }
  .font-display {
    font-family: 'Anton', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .skew-card {
    clip-path: none;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .card-pattern {
    background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 0, transparent 50%);
    background-size: 15px 15px;
  }
  .shine-effect::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%);
    transform: rotate(-45deg);
    animation: shine 6s infinite;
    pointer-events: none;
    z-index: 10;
  }
  @keyframes shine {
    0% { transform: translateX(-100%) rotate(-45deg); }
    20% { transform: translateX(100%) rotate(-45deg); }
    100% { transform: translateX(100%) rotate(-45deg); }
  }
  @media (min-width: 1024px) {
    .skew-card {
      clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
      margin-left: -2.5%;
      margin-right: -2.5%;
    }
    .skew-card:hover {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
      z-index: 50;
      transform: scale(1.04) translateY(-10px);
      margin-left: 0;
      margin-right: 0;
      box-shadow: 0 50px 80px -20px rgba(0, 0, 0, 0.9);
    }
  }
  .stagger-in {
    animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) both;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); filter: blur(10px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  .floating {
    animation: float 4s ease-in-out infinite;
  }
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  .drop-shadow-3d {
    filter: drop-shadow(0 30px 30px rgba(0, 0, 0, 0.65));
  }
  .header-shadow {
    text-shadow: 0 10px 0 rgba(0,0,0,0.8), 0 20px 30px rgba(0,0,0,0.4);
  }
  .snack-glow {
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.4), 0 0 50px rgba(255, 215, 0, 0.2);
    letter-spacing: 0.05em;
  }
  .bg-mesh {
    background-image: radial-gradient(at 0% 0%, rgba(255,255,255,0.15) 0px, transparent 50%),
                      radial-gradient(at 100% 100%, rgba(0,0,0,0.1) 0px, transparent 50%);
  }
  .card-divider {
    position: absolute;
    right: 0;
    top: 25%;
    height: 50%;
    width: 2px;
    filter: drop-shadow(0 0 5px rgba(255,255,255,0.3));
    background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.7), transparent);
    z-index: 10;
    pointer-events: none;
  }
  .pulse-load {
    animation: pulse-overlay 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes pulse-overlay {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.25; }
  }
  .neon-badge {
    background: linear-gradient(135deg, #fde047 0%, #f472b6 50%, #ec4899 100%);
    box-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3), inset 0 0 10px rgba(255,255,255,0.3);
    border: 2px solid rgba(255, 255, 255, 0.4);
    animation: badge-pulse 2s infinite;
  }
  @keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3), inset 0 0 10px rgba(255,255,255,0.3); }
    50% { box-shadow: 0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.5), inset 0 0 15px rgba(255,255,255,0.5); }
  }
  .ambient-mesh {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(at 20% 50%, rgba(233,30,99,0.15) 0px, transparent 50%),
                      radial-gradient(at 80% 80%, rgba(76,175,80,0.1) 0px, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  .bg-dots {
    background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  .floating-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
    animation: float 6s ease-in-out infinite;
    pointer-events: none;
  }
  #cart-toast {
    visibility: hidden;
    transition: visibility 0s, opacity 0.4s linear, transform 0.4s ease-out;
    opacity: 0;
    transform: translateY(20px);
  }
  #cart-toast.show {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
  .carousel-scrollbar::-webkit-scrollbar {
    height: 4px;
  }
  .carousel-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  .carousel-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }
</style>

<template>
  <div class="superdesign-preview">
    <main id="app" class="w-full bg-slate-950 selection:bg-red-500 selection:text-white flex flex-col lg:grid lg:grid-cols-[60%_40%] lg:h-[650px] relative">
      <div class="ambient-mesh"></div>
      <div class="absolute inset-0 bg-dots opacity-30 pointer-events-none z-0"></div>
      <div class="floating-circle w-64 h-64 -top-10 -left-10 z-0"></div>
      <div class="floating-circle w-96 h-96 bottom-10 left-1/4 z-0" style="animation-delay: -2s;"></div>
      <div class="floating-circle w-48 h-48 top-1/3 right-1/4 z-0" style="animation-delay: -4s;"></div>
      
      <section aria-label="Danh sách sản phẩm bán chạy" class="w-full h-[650px] lg:h-full relative z-10 overflow-hidden bg-transparent">
        <div class="flex flex-row items-stretch justify-start h-full overflow-x-auto snap-x snap-mandatory scroll-smooth carousel-scrollbar gap-0">
          
          <article class="skew-card group relative flex-1 min-w-[320px] lg:min-w-[280px] bg-[#E91E63] bg-mesh text-white p-10 pt-16 flex flex-col items-center stagger-in snap-center" style="animation-delay: 0.1s;">
            <div class="hidden lg:block card-divider"></div>
            <div class="card-pattern absolute inset-0 opacity-20 pointer-events-none pulse-load"></div>
            <div class="absolute top-6 right-10 z-30">
              <span class="text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold neon-badge flex items-center gap-1">
                <i class="iconify-icon text-sm" icon="lucide:flame"></i> BEST SELLER
              </span>
            </div>
            <h3 class="font-display text-4xl lg:text-5xl mb-2 text-center group-hover:scale-105 transition-transform duration-500 drop-shadow-md">FRUIT<br>GUMMY</h3>
            <div class="flex flex-col items-center mb-8">
              <span class="font-display text-2xl lg:text-3xl text-white/90 tracking-wide">$3.50</span>
              <button onclick="showToast('Fruit Gummy')" id="cta-fruit-gummy" aria-label="Mua Fruit Gummy giá 3.50 đô la" class="mt-4 bg-white text-[#E91E63] font-bold py-2.5 px-8 rounded-full shadow-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 hover:bg-slate-50">
                MUA NGAY
              </button>
            </div>
            <div class="relative w-full flex items-center justify-center mb-6 shine-effect mx-auto overflow-hidden">
              <img src="https://vgbujcuwptvheqijyjyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/93bdea08-3103-4c0c-b11f-6a8e8eb00a61/1794964725584-0e56e839/candy.webp" loading="lazy" decoding="async" sizes="(max-width: 768px) 320px, 400px" alt="Gói kẹo dẻo Fruit Gummy đầy màu sắc" class="block w-80 max-w-full h-auto object-contain floating drop-shadow-3d z-20 mx-auto lg:-translate-x-[15px]" onerror="this.onerror=null;this.src='https://placehold.co/320x400/1a1a1a/888?text=Image';">
            </div>
          </article>

          <article class="skew-card group relative flex-1 min-w-[320px] lg:min-w-[280px] bg-[#FFC107] bg-mesh text-slate-900 p-10 pt-16 flex flex-col items-center stagger-in snap-center" style="animation-delay: 0.2s;">
            <div class="hidden lg:block card-divider"></div>
            <div class="card-pattern absolute inset-0 opacity-10 pointer-events-none pulse-load"></div>
            <div class="absolute top-6 right-10 z-30">
              <span class="text-white px-3 py-1 rounded-full text-[10px] font-bold neon-badge flex items-center gap-1">
                <i class="iconify-icon text-sm" icon="lucide:flame"></i> BEST SELLER
              </span>
            </div>
            <h3 class="font-display text-5xl mb-2 text-center group-hover:scale-105 transition-transform duration-500 drop-shadow-sm">POTATO<br>CHIPS</h3>
            <div class="flex flex-col items-center mb-8">
              <span class="font-display text-3xl text-red-600 tracking-wide">$2.90</span>
              <button onclick="showToast('Potato Chips')" id="cta-potato-chips" aria-label="Mua Potato Chips giá 2.90 đô la" class="mt-4 bg-slate-900 text-white font-bold py-2.5 px-8 rounded-full shadow-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 hover:bg-slate-800">
                MUA NGAY
              </button>
            </div>
            <div class="relative w-full flex items-center justify-center mb-6 shine-effect mx-auto overflow-hidden">
              <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/93bdea08-3103-4c0c-b11f-6a8e8eb00a61/1794964725797-bac39759/chips.webp" loading="lazy" decoding="async" sizes="(max-width: 768px) 320px, 400px" alt="Gói khoai tây chiên giòn rụm vị phô mai" class="block w-80 max-w-full h-auto object-contain floating drop-shadow-3d z-20 mx-auto lg:-translate-x-[15px]" style="animation-delay: 0.5s" onerror="this.onerror=null;this.src='https://placehold.co/320x400/1a1a1a/888?text=Image';">
            </div>
          </article>

          <article class="skew-card group relative flex-1 min-w-[320px] lg:min-w-[280px] bg-[#4CAF50] bg-mesh text-white p-10 pt-16 flex flex-col items-center stagger-in snap-center" style="animation-delay: 0.3s;">
            <div class="hidden lg:block card-divider"></div>
            <div class="card-pattern absolute inset-0 opacity-20 pointer-events-none pulse-load"></div>
            <h3 class="font-display text-4xl lg:text-5xl mb-2 text-center group-hover:scale-105 transition-transform duration-500 drop-shadow-md">HEALTHY<br>NUTS</h3>
            <div class="flex flex-col items-center mb-8">
              <span class="font-display text-2xl lg:text-3xl text-white/90 tracking-wide">$5.80</span>
              <button onclick="showToast('Healthy Nuts')" id="cta-healthy-nuts" aria-label="Mua Healthy Nuts giá 5.80 đô la" class="mt-4 bg-white text-[#4CAF50] font-bold py-2.5 px-8 rounded-full shadow-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 hover:bg-slate-50">
                MUA NGAY
              </button>
            </div>
            <div class="relative w-full flex items-center justify-center mb-6 shine-effect mx-auto overflow-hidden">
              <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/93bdea08-3103-4c0c-b11f-6a8e8eb00a61/1794964726333-e9ed18b9/healthy.webp" loading="lazy" decoding="async" sizes="(max-width: 768px) 320px, 400px" alt="Gói ngũ cốc dinh dưỡng với các loại hạt" class="block w-80 max-w-full h-auto object-contain floating drop-shadow-3d z-20 mx-auto lg:-translate-x-[15px]" style="animation-delay: 1s" onerror="this.onerror=null;this.src='https://placehold.co/320x400/1a1a1a/888?text=Image';">
            </div>
          </article>

          <article class="skew-card group relative flex-1 min-w-[320px] lg:min-w-[280px] bg-[#DC3545] bg-mesh text-white p-10 pt-16 flex flex-col items-center stagger-in snap-center" style="animation-delay: 0.4s;">
            <div class="hidden lg:block card-divider"></div>
            <div class="card-pattern absolute inset-0 opacity-20 pointer-events-none pulse-load"></div>
            <h3 class="font-display text-4xl lg:text-5xl mb-2 text-center group-hover:scale-105 transition-transform duration-500 drop-shadow-md">INSTANT<br>SAUSAGE</h3>
            <div class="flex flex-col items-center mb-8">
              <span class="font-display text-2xl lg:text-3xl text-white/90 tracking-wide">$4.20</span>
              <button onclick="showToast('Instant Sausage')" id="cta-instant-sausage" aria-label="Mua Instant Sausage giá 4.20 đô la" class="mt-4 bg-white text-[#DC3545] font-bold py-2.5 px-8 rounded-full shadow-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 hover:bg-slate-50">
                MUA NGAY
              </button>
            </div>
            <div class="relative w-full flex items-center justify-center mb-6 shine-effect mx-auto overflow-hidden">
              <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/93bdea08-3103-4c0c-b11f-6a8e8eb00a61/1794964726541-6b97a4c4/instant.webp" loading="lazy" decoding="async" sizes="(max-width: 768px) 320px, 400px" alt="Xúc xích ăn liền thơm ngon chuẩn vị" class="block w-80 max-w-full h-auto object-contain floating drop-shadow-3d z-20 mx-auto lg:-translate-x-[15px]" style="animation-delay: 1.5s" onerror="this.onerror=null;this.src='https://placehold.co/320x400/1a1a1a/888?text=Image';">
            </div>
          </article>

          <article class="skew-card group relative flex-1 min-w-[320px] lg:min-w-[280px] bg-[#FF6B35] bg-mesh text-white p-10 pt-16 flex flex-col items-center stagger-in snap-center" style="animation-delay: 0.5s;">
            <div class="card-pattern absolute inset-0 opacity-20 pointer-events-none pulse-load"></div>
            <div class="absolute top-6 right-10 z-30">
              <span class="text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold neon-badge flex items-center gap-1">
                <i class="iconify-icon text-sm" icon="lucide:flame"></i> BEST SELLER
              </span>
            </div>
            <h3 class="font-display text-4xl lg:text-5xl mb-2 text-center group-hover:scale-105 transition-transform duration-500 drop-shadow-md">SPICY<br>STICK</h3>
            <div class="flex flex-col items-center mb-8">
              <span class="font-display text-2xl lg:text-3xl text-white/90 tracking-wide">$3.80</span>
              <button onclick="showToast('Spicy Stick')" id="cta-spicy-stick" aria-label="Mua Spicy Stick giá 3.80 đô la" class="mt-4 bg-white text-[#FF6B35] font-bold py-2.5 px-8 rounded-full shadow-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 hover:bg-slate-50">
                MUA NGAY
              </button>
            </div>
            <div class="relative w-full flex items-center justify-center mb-6 shine-effect mx-auto overflow-hidden">
              <img src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/93bdea08-3103-4c0c-b11f-6a8e8eb00a61/1794964726742-9e4d5f78/spicy.webp" loading="lazy" decoding="async" sizes="(max-width: 768px) 320px, 400px" alt="Gói que cay bùng vị nồng nàn" class="block w-80 max-w-full h-auto object-contain floating drop-shadow-3d z-20 mx-auto lg:-translate-x-[15px]" style="animation-delay: 2s" onerror="this.onerror=null;this.src='https://placehold.co/320x400/1a1a1a/888?text=Image';">
            </div>
          </article>

        </div>
      </section>

      <header class="w-full h-auto lg:h-full flex flex-col justify-center items-center relative px-6 lg:px-12 py-12 lg:py-0 text-center bg-transparent z-20">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none w-full overflow-hidden">
          <h1 class="text-7xl lg:text-[10rem] xl:text-[12rem] font-display text-white whitespace-nowrap tracking-tighter">DOP MART</h1>
        </div>
        <div class="relative z-10 w-full max-w-lg mx-auto bg-black/20 backdrop-blur-sm p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="h-px w-8 bg-white/20"></div>
            <span class="font-display text-sm tracking-[0.4em] text-white/60">DOP MART EXCLUSIVE</span>
            <div class="h-px w-8 bg-white/20"></div>
          </div>
          <span class="inline-block bg-gradient-to-r from-red-600 to-orange-500 text-white px-5 py-1 rounded-full text-[10px] md:text-xs font-bold mb-6 lg:mb-8 tracking-[0.2em] shadow-lg shadow-red-900/20 uppercase">Món ngon mỗi ngày</span>
          <h2 class="text-5xl sm:text-7xl lg:text-7xl xl:text-9xl font-display text-white mb-6 lg:mb-8 tracking-tighter leading-[0.9] header-shadow">
            TOP <span class="text-white snack-glow">SNACK</span> BÁN CHẠY
          </h2>
          <p class="text-slate-400 text-base md:text-lg font-medium opacity-80">
            Khám phá những hương vị độc bản tại DOP Mart. Mỗi sản phẩm là một hành trình cảm xúc từ nguyên liệu tự nhiên nhất.
          </p>
        </div>
      </header>

      <div id="cart-toast" class="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20">
        <i class="iconify-icon text-2xl" icon="lucide:check-circle"></i>
        <span id="toast-message" class="font-bold">Added to cart!</span>
      </div>
    </main>
  </div>
</template>

<script type="module">
  // SuperDesign Runtime
  console.log('[SuperDesign] Preview loaded');

  window.__SUPERDESIGN_PREVIEW__ = {
    versionId: "38f1c754-d574-47c1-ad49-9a797e0f6a5c",
    timestamp: "2026-11-18T18:03:33.853Z",

    sendMessage: function(type, data) {
      if (window.parent) {
        window.parent.postMessage({
          source: 'superdesign-preview',
          type: type,
          data: data,
          versionId: this.versionId
        }, '*');
      }
    },

    ready: function() {
      this.sendMessage('ready', { timestamp: Date.now() });
    }
  };
</script>