<template>
  <div class="quiz">
    <h2 :class="{ censored: isCensored }"><span>{{title}}</span></h2>
    <div :class="{ navOpen: menuOpen }" @click="menuOpen = !menuOpen" id="navIcon">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <transition name="showMenu">
      <div class="menu" v-if="menuOpen">
        <h2>Options</h2>
        <label for="langPicker">Language:</label>
        <select id="langPicker" v-model="lang">
          <option value="en">English</option>
          <option value="fi">Finnish</option>
        </select>
        <br/>
        <label for="difficultyPicker">Articles:</label>
        <select id="difficultyPicker" v-model="difficulty">
          <option value="all">All</option>
          <option value="100">Top-100</option>
          <option value="250">Top-250</option>
          <option value="500">Top-500</option>
          <option value="1000">Top-1000</option>
        </select>
      </div>
    </transition>
    <span :class="{ censored: isCensored }" v-html="censoredSummary"></span>
    <div class="controls">
      <input v-model="guess" placeholder="Type your guess" @keydown.enter="makeGuess" :disabled="victory">
      <button @click="makeGuess">Guess!</button>
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
  data: function() {
    return {
      lang: 'en',
      title: null,
      summary: null,
      error: null,
      refreshText: 'Give up',
      isCensored: true,
      guess: null,
      victory: false,
      menuOpen: false,
      score: 0,
      difficulty: 'all'
    }
  },
  watch: {
    lang: function() {
      this.refresh()
    },
    difficulty: function() {
      this.refresh()
    },
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
      const url = 'http://localhost:3001/apiv1?lang='+this.lang+'&top='+this.difficulty
      const vm = this
      axios.get(url)
        .then(function (response) {
          if(response.data.error) {
            vm.error = response.data.error
          } else {
            vm.isCensored = true
            vm.title = response.data.title
            vm.summary = response.data.summary
            vm.refreshText = "Give up"
          }
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
  border: solid #2c3e50 0.2rem;
  color: transparent;
  user-select: none;
  white-space:nowrap;
  background: repeating-linear-gradient(
    -45deg,
    #FFFFFF,
    #FFFFFF 0.3rem,
    #2c3e50 0.3rem,
    #2c3e50 0.6rem
  );
}

select {
  margin: 0.5rem;
  cursor: pointer;
  border: none;
  border-radius: 0.3rem;
  padding: 0.2rem 0.5rem;
  font-size: inherit;
  background-color: white;
  color: #2c3e50;
  box-shadow: 0 0.1rem 0.2rem #888888;
  background-position: center right;
  background-repeat: no-repeat;
}

button {
  margin: 0;
  margin-left: 0.5rem;
  white-space:nowrap;
  padding: 0 0.6rem;
  display: inline-block;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  background-color: white;
  color: #2c3e50;
  box-shadow: 0 0.1rem 0.2rem #888888;
}

button:active {
  background-color: #2c3e50;
  color: white;
}

input {
  white-space:nowrap;
  border: none;
  border-radius: 0.3rem;
  height: 1.8rem;
  padding-left: 0.5rem;
  background-color: white;
  color: #2c3e50;
  box-shadow: 0 0.1rem 0.2rem #888888;
}

.controls input {
  flex: 1;
  box-sizing:border-box;
  min-width: 8rem;
}

.censored p {
  user-select: none;
}

.controls {
  width: 100%;
  display: flex;
  flex-direction: row;
}

.menu {
  position: absolute;
  width: 100%;
  height: 100%;
  background: white;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 0.5rem;
}

#navIcon {
  width: 2.5rem;
  height: 1.95rem;
  position: absolute;
  top: 1.8rem;
  right: 2rem;
  cursor: pointer;
  background: white;
  border-radius: 0.4rem;
  z-index: 4;
}

#navIcon span {
  display: block;
  position: absolute;
  border-radius: 0.2rem;
  height: 0.4rem;
  width: 100%;
  background: #2c3e50;
  opacity: 1;
  left: 0;
  transform: rotate(0deg);
  transition: .25s ease-in-out;
}

#navIcon span:nth-child(1) {
  top: 0;
}

#navIcon span:nth-child(2),#navIcon span:nth-child(3) {
  top: 0.8rem;
}

#navIcon span:nth-child(4) {
  top: 1.6rem;
}

#navIcon.navOpen span:nth-child(1) {
  top: 0.8rem;
  width: 0%;
  left: 50%;
}

#navIcon.navOpen span:nth-child(2) {
  transform: rotate(45deg);
}

#navIcon.navOpen span:nth-child(3) {
  transform: rotate(-45deg);
}

#navIcon.navOpen span:nth-child(4) {
  top: 18px;
  width: 0%;
  left: 50%;
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

@media screen and (max-width: 500px) {
  .quiz {
    margin: 0;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
  }
  #navIcon {
    width: 2.2rem;
    top: 0.1rem;
    right: 0.3rem;
  }
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

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.showMenu-enter-active, .showMenu-leave-active {
  transition: opacity .1s;
}

.showMenu-enter, .showMenu-leave-to {
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

