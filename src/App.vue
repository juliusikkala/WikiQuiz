<template>
  <div id="app">
    <h1>WikiQuiz</h1>
    <Quiz id="quiz" lang="en"/>
    <div id="footer">
      <p>Copyright 2019 Julius Ikkala. All summaries are from Wikipedia.</p>
    </div>
  </div>
</template>

<script>
import Quiz from './components/Quiz.vue'

export default {
  name: 'app',
  components: {
    Quiz
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  font-size: 2rem;
  color: #2c3e50;
  margin-top: 60px;
  z-index: 1;
}

#quiz {
  position: relative;
  margin: auto;
  font-size: 1rem;
  z-index: 2;
}

#footer {
  position: fixed;
  box-sizing: border-box;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.9rem;
  z-index: 0;
}
</style>
