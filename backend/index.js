const express = require('express')
const axios = require('axios')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
app.use(cors())

const top1000 = {};

async function getTop1000(lang) {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth()-1)
  const year = date.getFullYear()
  let month = (date.getMonth()+1).toString()
  if(month.length == 1) {
    month = '0'+month
  }
  const url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/'+lang+'.wikipedia/all-access/'+year+'/'+month+'/all-days'
  if(!(url in top1000)) {
    const response = await axios.get(url);
    top1000[url] = response.data.items[0].articles.map(({article}) => article).filter(
      article => !(
        article.startsWith('Special:') ||
        article.startsWith('Help:') ||
        article.startsWith('File:') ||
        article.startsWith('Category:') ||
        article.startsWith('Portal:') ||
        article.startsWith('List_of_') ||
        article === 'Main_Page'
      )
    )
  }
  return top1000[url]
}

app.get('/apiv1', (req, res) => {
  const lang = req.query.lang || 'en'
  const top = parseInt(req.query.top)
  if(top) {
    getTop1000(lang).then(ret => {
      const selectLength = Math.min(ret.length, top)
      const article = ret[Math.floor(Math.random() * selectLength)]
      const url = 'https://'+lang+'.wikipedia.org/api/rest_v1/page/summary/'+article+'?redirect=true'
      axios.get(url)
        .then(function (response) {
          res.send({
            title: response.data.title.replace(/(,.*)|( *\([^)]*\) *)/g, ""),
            summary: response.data.extract,
          })
        }).catch(function (error) {
          console.log(error)
        })
    }).catch(function (error) {
      console.log(error)
    })
  } else {
    const url = 'https://'+lang+'.wikipedia.org/api/rest_v1/page/random/summary'
    axios.get(url)
      .then(function (response) {
        res.send({
          title: response.data.title.replace(/(,.*)|( *\([^)]*\) *)/g, ""),
          summary: response.data.extract,
        })
      }).catch(function (error) {
        console.log(error)
      })
  }
})

app.listen(port, () => console.log(`Started server on port ${port}`))
