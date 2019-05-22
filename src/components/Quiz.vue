<template>
  <div class="quiz">
    <span :class="{ censored: isCensored }" v-html="censoredSummary"></span>
    <div class="controls">
      <input v-model="guess" placeholder="Type your guess" @keydown.enter="makeGuess" :disabled="victory">
      <button @click="refresh">{{ refreshText }}</button>
      <transition name="fade">
        <div class="victory" v-if="victory">
          <h1 id="number"><span>#</span>1</h1>
          <h2 id="victory">Victory</h2>
          <h2 id="royale">Royale</h2>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Vue from 'vue';
import VueConfetti from 'vue-confetti';
import stringSimilarity from 'string-similarity'

Vue.use(VueConfetti)

const separator = /[,.;:?!'()[\]{} ]/
const separatorInc = /([,.;:?!'()[\]{} ])/

export default {
  name: 'Quiz',
  props: {
    lang: String,
  },
  data: function() {
    return {
      title: null,
      summary: null,
      error: null,
      refreshText: "Give up",
      isCensored: true,
      guess: null,
      victory: false,
      score: 0,
    }
  },
  computed: {
    whitelist: function () {
      return {
        'en': ['the', 'of', 'from', 'on', 'and', 'or', 'it', 'is'],
        'fi': ['ja', 'on'],
      }[this.lang];
    },
    censoredSummary: function() {
      if(this.error) {
        return '<p>'+this.error+'</p>'
      }
      if(!this.summary) {
        return '<p>Fetching a random article...</p>'
      }
      const fullTitle = this.title.toLowerCase().trim()
      const titleParts = fullTitle.split(separator)
      const whitelist = this.whitelist
      const parts = this.summary.split(separatorInc).map(
        function(part) {
          let censored = false
          if(!separator.test(part) && !whitelist.includes(part) && part.length != 0) {
            let maxSimilarity = stringSimilarity.compareTwoStrings(
              part.toLowerCase(), fullTitle)
            titleParts.forEach(function(titlePart) {
              maxSimilarity = Math.max(
                maxSimilarity,
                stringSimilarity.compareTwoStrings(part.toLowerCase(), titlePart)
              )
            })
            if(maxSimilarity > 0.9) 
              censored = true;
          }
          return {
            censored: censored,
            str: part
          }
        }
      )
      // Fill separator with censorship from around.
      for(let i = 1; i < parts.length-1; ++i) {
        if(parts[i-1].censored && parts[i+1].censored && separator.test(parts[i].str)) {
          parts[i].censored = true
        }
      }
      console.log(parts)
      let formatted = '<p>';

      let prevCensored = false;
      for(let part of parts) {
        if(part.censored && !prevCensored) {
          formatted += '<span>';
        } else if(!part.censored && prevCensored) {
          formatted += '</span>';
        }
        formatted += part.str;
        prevCensored = part.censored;
      }
      if(prevCensored) formatted += '</span>';

      return formatted+'</p>'
    }
  },
  methods: {
    sanitize: function (str) {
      const parts = str.toLowerCase().trim().split(separator)
      let newParts = []
      for(let part of parts) {
        if(!this.whitelist.includes(part)) {
          newParts.push(part)
        }
      }
      return newParts.join(" ")
    },
    makeGuess: function () {
      if(this.victory) {
        return;
      }
      const similarity = stringSimilarity.compareTwoStrings(
        this.sanitize(this.guess),
        this.sanitize(this.title)
      )
      if(similarity > 0.8) {
        this.victory = true
        this.refreshText = "NEXT!"
        this.$confetti.start()
        this.$confetti.update({
          shape: 'rect',
          colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
        })
        this.score = similarity
      }
    },

    refresh: function() {
      this.isCensored = false
      this.guess = null
      if(!this.victory) setTimeout(this.fetchSummary, 1000)
      else this.fetchSummary();
      this.$confetti.stop()
      this.victory = false
    },

    fetchSummary: function() {
      const url = 'https://'+this.lang+'.wikipedia.org/api/rest_v1/page/random/summary'
      const vm = this
      axios.get(url)
        .then(function (response) {
          vm.isCensored = true
          vm.title = response.data.title.replace(/(,.*)|( *\([^)]*\) *)/g, "")
          vm.summary = response.data.extract
          vm.refreshText = "Give up"
        })
        .catch(function (error) {
          vm.error = error
        })
    },
  },
  created: function() {
    this.fetchSummary()
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Bangers&display=swap');

.censored span {
  border-radius: 0.3rem;
  border: solid #E24949 0.2rem;
  color: transparent;
  user-select: none;
  white-space:nowrap;
  background: repeating-linear-gradient(
    -45deg,
    #FFFFFF,
    #FFFFFF 0.3rem,
    #E24949 0.3rem,
    #E24949 0.6rem
  );
}

.censored p {
  user-select: none;
}

.controls {
  width: 100%;
  display: flex;
  flex-direction: row;
}

.controls button {
  margin: 0 0.5rem;
}
.controls input {
  flex: 1;
  margin: 0 0.5rem;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.quiz {
  max-width: 40rem;
  box-shadow: 0 0.3rem 1rem #888888;
  padding: 0.5rem 2rem 1.2rem 2rem;
  border-radius: 0.5rem;
  background: white;
}

@keyframes zoomer {
  from {
    transform: rotate(-3deg) skew(-30deg) scale(0.5);
  }

  to {
    transform: rotate(3deg) skew(-30deg) scale(1.0);
  }
}

.victory {
  position: fixed;
  top: 50%;
  left: 50%;
  margin-top: -4rem;
  margin-left: -14rem;
  font-family: 'Bangers', cursive;
  background: rgb(2,176,230);
  background: radial-gradient(
    circle at bottom left,
    rgba(2,176,230,1) 0%,
    rgba(1,103,198,1) 100%
  ); 
  width: 30rem;
  height: 10rem;
  transform: rotate(-3deg) skew(-30deg);
  box-shadow: 0.5rem 0.5rem 0rem #112747;

  pointer-events: none;
  animation-duration: 0.5s;
  animation-name: zoomer;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

#number {
  position: absolute;
  color: #FFF46D;
  font-size: 9rem;
  margin: 5rem 1.5rem 0rem 0rem;
  bottom: 0.3rem;
  right: 24rem;
  transform: skew(33deg) rotate(-10deg);
  text-shadow: 0.2rem 0.5rem #000000;
}

#number span {
  font-size: 6rem;
  vertical-align: middle;
}

#victory {
  position: absolute;
  color: #EFF6FC;
  font-size: 4.6rem;
  transform: skew(33deg);
  text-transform: uppercase;
  left: 3rem;
  bottom: 1rem;
  text-shadow: 0.2rem 0.5rem #3A4084;
}
#victory::first-letter {
  font-size: 6.5rem;
}
#royale {
  position: absolute;
  color: #EFF6FC;
  font-size: 4.6rem;
  transform: skew(33deg);
  text-transform: uppercase;
  left: 10rem;
  bottom: -4.3rem;
  text-shadow: 0.2rem 0.5rem #3A4084;
}
#royale::first-letter {
  font-size: 6.5rem;
}
</style>

