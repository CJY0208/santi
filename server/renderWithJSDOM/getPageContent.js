const DEFAULT_CONFIG = {
  deferHeadScripts: true,
  asyncHeadScripts: false,
  inlinePrimaryStyle: true,
  renderAfterDocumentEvent: undefined,
  renderAfterTimeout: undefined,
  renderAfterElementExists: undefined,
  renderAfterTime: undefined
}

const getPageContent = (dom, config = DEFAULT_CONFIG, resources) =>
  new Promise((resolve, reject) => {
    const options = {
      ...DEFAULT_CONFIG,
      ...config
    }

    try {
      const { window } = dom
      const { document } = window
      let interval
      let timeout

      function captureDocument() {
        // console.log('节点数：', document.body.querySelectorAll('*').length)
        if (options.deferHeadScripts) {
          // defer scripts
          document.head.querySelectorAll('script[src]').forEach(tag => {
            tag.setAttribute('defer', '')
          })
        }

        if (options.asyncHeadScripts) {
          // async scripts
          document.head.querySelectorAll('script[src]').forEach(tag => {
            tag.setAttribute('async', '')
          })
        }

        if (options.inlinePrimaryStyle) {
          const { cache } = resources
          // extra and inject primary style
          document.head
            .querySelectorAll('link[rel="stylesheet"]')
            .forEach(tag => {
              if (!cache[tag.href] || !cache[tag.href].response) {
                return
              }
              const style = document.createElement('style')
              const cssText = cache[tag.href].response.body.toString()

              style.innerHTML = cssText

              document.head.appendChild(style)
              // document.head.removeChild(tag)
              document.body.appendChild(tag)
            })
        }

        // get page content string
        try {
          const html = dom.serialize()
          resolve(html)
        } catch (err) {
          console.log('[JSDOM Serialize error]', err)
          reject(err)
        }

        if (interval) {
          clearInterval(interval)
          interval = null
        }

        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }

        if (options.renderAfterDocumentEvent) {
          document.removeEventListener(
            options.renderAfterDocumentEvent,
            captureDocument
          )
        }

        function close() {
          try {
            window.close()
            if (typeof global.gc === 'function') {
              global.gc()
            }
          } catch (err) {
            console.error(err)
          }
        }

        // window.close MUST call after document.readyState turn to 'complete' or would causing Memory Leak
        // Ref: https://github.com/jsdom/jsdom/issues/2742
        if (document.readyState === 'complete') {
          close()
        } else {
          function onReady() {
            if (document.readyState !== 'complete') {
              return
            }

            document.removeEventListener('readystatechange', onReady)
            close()
          }

          document.addEventListener('readystatechange', onReady)
        }
      }

      // CAPTURE WHEN AN EVENT FIRES ON THE DOCUMENT
      if (options.renderAfterDocumentEvent) {
        document.addEventListener(
          options.renderAfterDocumentEvent,
          captureDocument
        )

        if (options.renderAfterTimeout) {
          timeout = setTimeout(captureDocument, options.renderAfterTimeout)
        }

        // CAPTURE ONCE A SPECIFC ELEMENT EXISTS
      } else if (options.renderAfterElementExists) {
        interval = setInterval(() => {
          if (document.querySelector(options.renderAfterElementExists)) {
            captureDocument()
          }
        }, 100)

        if (options.renderAfterTimeout) {
          timeout = setTimeout(captureDocument, options.renderAfterTimeout)
        }
        // CAPTURE AFTER A NUMBER OF MILLISECONDS
      } else if (options.renderAfterTime) {
        setTimeout(captureDocument, options.renderAfterTime)

        // DEFAULT: RUN IMMEDIATELY
      } else {
        captureDocument()
      }
    } catch (error) {
      console.log('[getPageContent error]', error)
      reject(error)
    }
  })

module.exports = getPageContent
