<template>
  <div id="app">
    <h1>WikiQuiz</h1>
    <Quiz id="quiz" lang="en"/>
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
}

#quiz {
  margin: auto;
  font-size: 1rem;
}
</style>
