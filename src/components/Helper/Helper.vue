<template>
    <div :class="{
      'theme-helper': true,
      'theme-helper-opened': opened,
      'hided': hided
    }">
        <div class="theme-helper-toggler" @click="toggle">
            <div class="theme-helper-spinner bg-primary text-white">
                <i class="la la-cog"></i>
                <i class="la la-cog fs-smaller"></i>
            </div>
        </div>
      <section class="widget theme-helper-content">


        </section>

    </div>
</template>

<script>


export default {
    name: 'Helper',
    data() {
      return {
        opened: false,
        hided: true,
      }
    },
    computed:{

    },
    methods: {
      toggle(){
        this.opened = !this.opened;
      }
    },
    mounted(){
    }
};
</script>

<style src="./Helper.scss" lang="scss"></style>
