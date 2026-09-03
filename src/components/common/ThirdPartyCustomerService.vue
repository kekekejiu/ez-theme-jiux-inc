<template>
  <span v-if="false" aria-hidden="true"></span>
</template>

<script>
import { onMounted } from 'vue';
import { CUSTOMER_SERVICE_CONFIG } from '@/utils/baseConfig';

export default {
  name: 'ThirdPartyCustomerService',
  setup() {
    const loadScript = () => {
      if (!CUSTOMER_SERVICE_CONFIG.enabled || CUSTOMER_SERVICE_CONFIG.type !== 'other') return;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = CUSTOMER_SERVICE_CONFIG.customHtml || '';
      const source = wrapper.querySelector('script');
      if (!source?.src) return;
      if (document.querySelector(`script[src="${source.src}"]`)) return;

      const script = document.createElement('script');
      Array.from(source.attributes).forEach(({ name, value }) => script.setAttribute(name, value));
      script.async = true;
      script.dataset.customerService = 'third-party';
      document.body.appendChild(script);
    };

    onMounted(loadScript);
    return {};
  }
};
</script>
