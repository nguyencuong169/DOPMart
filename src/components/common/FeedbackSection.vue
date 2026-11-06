<script setup>
import { ref } from "vue";
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Lightbulb,
  PackagePlus,
  Smile,
} from "lucide-vue-next";
const type = ref("product"),
  message = ref(""),
  sent = ref(false);
function submit() {
  if (!message.value.trim()) return;
  sent.value = true;
  message.value = "";
  setTimeout(() => (sent.value = false), 3500);
}
</script>
<template>
  <section class="feedback-section">
    <div class="feedback-copy">
      <span class="kicker">BUILD DOP MART TOGETHER</span>
      <h2>Bạn muốn DOP Mart<br />có thêm điều gì?</h2>
      <p>
        Gợi ý một món mới, chia sẻ trải nghiệm đặt hàng hoặc góp ý để DOP Mart phục vụ
        tầng 14 và 20 tốt hơn.
      </p>
      <div class="feedback-types">
        <button :class="{ active: type === 'product' }" @click="type = 'product'">
          <PackagePlus /> Gợi ý sản phẩm</button
        ><button :class="{ active: type === 'idea' }" @click="type = 'idea'">
          <Lightbulb /> Ý tưởng mới</button
        ><button :class="{ active: type === 'experience' }" @click="type = 'experience'">
          <Smile /> Trải nghiệm
        </button>
      </div>
    </div>
    <form class="feedback-form" @submit.prevent="submit">
      <div class="feedback-icon"><MessageCircle /></div>
      <label
        >Nội dung đóng góp<textarea
          v-model="message"
          rows="5"
          :placeholder="
            type === 'product'
              ? 'Ví dụ: DOP Mart nên có thêm sữa chua uống...'
              : 'Hãy chia sẻ ý kiến của bạn...'
          "
          required
        ></textarea></label
      ><label class="feedback-name"
        >Tên hoặc team <input placeholder="Không bắt buộc" /></label
      ><button class="checkout" type="submit">Gửi đóng góp <Send /></button
      ><Transition name="quick"
        ><div v-if="sent" class="feedback-success">
          <CheckCircle2 /> Cảm ơn bạn. Ý kiến đã được ghi nhận trên trình duyệt demo.
        </div></Transition
      >
    </form>
  </section>
</template>
