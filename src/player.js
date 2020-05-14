(() => {
  /// Config
  const mixesDirectory = 'https://media.infinitenew.world/mixes/'
  const radioArchiveDirectory = 'https://media.infinitenew.world/radio/'
  const radioHomeUrl = `https://radio.infinitenew.world`
  const radioStreamUrl = 'https://radio.infinitenew.world/stream'
  const radioMetadataUpdateInterval = 10 * 1000

  /// Setup HTML Structure
  const containerHtml = `
    <div class="inw-loading"></div>

    <button class="inw-player-play-btn"></button>

    <div class="inw-player-current-item-container">
      <div class="inw-player-current-item-text">
        <div class="inw-player-current-item-type"></div>
        <div class="inw-player-current-item-title"></div>
      </div>

      <div class="inw-player-current-audio-ui">
        <div class="inw-player-current-time"></div>
        <div class="inw-player-duration"></div>
        <div class="inw-player-progress-bar-base inw-player-progress-bar-bg"></div>
        <div class="inw-player-progress-bar-base inw-player-progress-bar"></div>
      </div>
    </div>

    <audio id="inw-player-audio"></audio>
  `

  const container = document.createElement('div')
  container.className = 'inw-player-container'
  container.innerHTML = containerHtml
  document.body.appendChild(container)

  const loadingIndicator = container.querySelector('.inw-loading')
  const playButton = container.querySelector('.inw-player-play-btn')

  const currentItemContainer = container.querySelector('.inw-player-current-item-container')
  const currentItemTypeEl = container.querySelector('.inw-player-current-item-type')
  const currentItemTitleEl = container.querySelector('.inw-player-current-item-title')
  const currentTimeEl = container.querySelector('.inw-player-current-time')
  const durationEl = container.querySelector('.inw-player-duration')
  const progressBarBgEl = container.querySelector('.inw-player-progress-bar-bg')
  const progressBarEl = container.querySelector('.inw-player-progress-bar')

  const audioEl = container.querySelector('audio')

  /// Data
  const data = {
    mixItems: [],
    radioArchiveItems: [],
    homePageMixes: scrapeHomepageMixList() // Get list of all mixes shown on the home page
  }

  /// State
  const state = {
    loading: true,
    radioAvailable: false,
    radioMetadata: null, // null or { name, description }
    currentAudioItem: null, // null or { type, name, url } item
    playing: false
  }

  /// Render

  const zpad = (n, len = 2) => {
    let ns = n + ''
    while (ns.length < len) {
      ns = '0' + ns
    }
    return ns
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds - h * 3600) / 60)
    const s = Math.round(seconds - h * 3600 - m * 60)
    return `${h > 0 ? `${zpad(h)}:` : ''}${zpad(m)}:${zpad(s)}`
  }

  const updateAudioUIElements = () => {
    if (state.currentAudioItem) {
      const radio = state.currentAudioItem.type === 'Radio'
      const time = audioEl.currentTime || 0
      const duration = audioEl.duration
      const progress = time / duration
      currentTimeEl.innerHTML = `${formatTime(time)}`
      durationEl.innerHTML = radio ? '' : `${formatTime(duration)}`
      progressBarEl.style.display = radio ? 'none' : 'block'
      // progressBarEl.style.transform = `scaleX(${progress})`
      progressBarEl.style.width = `${progress * 100}%`
    }
  }

  const renderFromState = () => {
    loadingIndicator.style.display = state.loading ? 'block' : 'none'
    loadingIndicator.innerHTML = state.loading ? 'Loading...' : ''

    playButton.innerHTML = state.playing ? 'Pause' : 'Play'

    currentItemContainer.style.display = state.currentAudioItem ? 'block' : 'none'
    currentItemTypeEl.innerHTML = state.currentAudioItem ? state.currentAudioItem.type : ''
    currentItemTitleEl.innerHTML = state.currentAudioItem ? state.currentAudioItem.name : ''
    updateAudioUIElements()
  }

  /// Audio Updates

  const setAudioProgress = (progress) => {
    if (state.currentAudioItem && state.currentAudioItem.type !== 'Radio' && audioEl.duration) {
      const p = Math.max(0, Math.min(1, progress))
      audioEl.currentTime = p * audioEl.duration
    }
  }

  const updateAudioSrc = () => {
    if (state.currentAudioItem) {
      audioEl.src = state.currentAudioItem.url
    } else {
      audioEl.src = null
      audioEl.currentTime = 0
      state.playing = false
    }
  }

  const playAudio = () => {
    if (state.currentAudioItem) {
      audioEl.play()
      state.playing = true
    } else {
      audioEl.pause()
      state.playing = false
    }
  }

  const getRadioName = () => {
    const md = state.radioMetadata
    return md ? `${md.name}${md.description ? ` - ${md.description}` : ''}` : ''
  }

  const chooseInitialSrc = () => {
    if (state.radioAvailable) {
      state.currentAudioItem = {
        type: 'Radio',
        name: getRadioName(),
        url: radioStreamUrl
      }
      updateAudioSrc()
      return
    }

    // choose randomly from available media
    const possibleItems = [
      ...data.mixItems,
      ...data.radioArchiveItems
    ]

    if (possibleItems.length === 0) {
      return
    }

    const item = possibleItems[Math.floor(Math.random() * possibleItems.length)]
    state.currentAudioItem = item
    updateAudioSrc()
  }

  /// Setup interaction logic

  // main play button logic
  playButton.onclick = () => {
    if (state.loading) {
      return
    }

    if (state.playing) {
      audioEl.pause()
      state.playing = false
    } else {
      if (!state.currentAudioItem) {
        chooseInitialSrc()
      }

      playAudio()
    }

    renderFromState()
  }

  // when images for mix on homepage are clicked, play the relevant mix
  data.homePageMixes.forEach(item => {
    if (item.imgEl) {
      item.imgEl.onclick = (e) => {
        const mixItem = data.mixItems.find(d => d.name == item.title)
        if (mixItem) {
          state.currentAudioItem = mixItem
          updateAudioSrc()
          playAudio()
          renderFromState()
        }
      }
    }
  })

  // progress bar click logic
  progressBarBgEl.onclick = (e) => {
    const progress = e.offsetX / e.target.offsetWidth
    setAudioProgress(progress)
  }
  progressBarEl.onclick = (e) => {
    const offsetWidth = progressBarBgEl.getBoundingClientRect().width
    const progress = e.offsetX / offsetWidth
    setAudioProgress(progress)
  }

  /// Loading Initial State

  const loadMixArchiveItems = () => scrapeNamecheapHostingDirectoryForLinkNames(mixesDirectory)
    .then(archiveNames => {
      return archiveNames.map(name => ({ type: 'mix', name: name, url: `${mixesDirectory}${name}/${name}.mp3` }))
    })

  const loadRadioArchiveItems = () => scrapeNamecheapHostingDirectoryForLinkNames(radioArchiveDirectory)
    .then(archiveNames => {
      return archiveNames.map(name => ({ type: 'radio-archive', name: name, url: `${radioArchiveDirectory}${name}/${name}.mp3` }))
    })

  const getRadioAvailable = () => fetch(radioStreamUrl)
    .then(res => res.status == 200)

  const updateRadioAvailable = () => getRadioAvailable().then(avail => {
    state.radioAvailable = !!avail
  })

  const updateRadioMetadata = () => scrapeIcecastHomepageForRadioMetadata().then(metadata => {
    state.radioMetadata = metadata
    if (state.currentAudioItem && state.currentAudioItem.type === 'Radio') {
      if (metadata) {
        state.currentAudioItem.name = getRadioName()
      } else {
        state.currentAudioItem = null
        currentAudioItem()
      }
      renderFromState()
    }
  })

  function loadExternalData() {
    return Promise.all([
      updateRadioAvailable(),
      updateRadioMetadata(),
      loadMixArchiveItems().then(items => {
        data.mixItems = items
      }),
      loadRadioArchiveItems().then(items => {
        data.radioArchiveItems = items
      })
    ])
  }

  function updateRadioAvailableAndMetadataLoop() {
    try {
      updateRadioAvailable()
      updateRadioMetadata()
    } catch (err) {
      console.log(err)
    }

    setTimeout(updateRadioAvailableAndMetadataLoop, radioMetadataUpdateInterval)
  }

  /// Starting Up

  renderFromState()

  loadExternalData().then(() => {
    state.loading = false
    console.log(data)
    renderFromState()

    setTimeout(updateRadioAvailableAndMetadataLoop, radioMetadataUpdateInterval)

    const updateAudioLoop = () => {
      updateAudioUIElements()
      requestAnimationFrame(updateAudioLoop)
    }
    updateAudioLoop()
  })

  /// Helper functions

  function scrapeHomepageMixList() {
    // kind of a horrible function that is dependent on the markup of the cargo site
    // ... uses it to grab a list of all visible mix titles and their corresponding images
    const homePageMixes = []
    const bodyCopy = document.getElementsByClassName('bodycopy')[2]
    if (bodyCopy) {
      const boldTitleEls = bodyCopy.querySelectorAll('h1 > b')
      const imageEls = bodyCopy.querySelectorAll('div > img')
      boldTitleEls.forEach((el, idx) => {
        const title = el.innerHTML
        const imgEl = imageEls[idx]
        if (title && imgEl) {
          homePageMixes.push({ title: title, titleEl: el, imgEl: imgEl })
        }
      })
    }

    return homePageMixes
  }

  function scrapeNamecheapHostingDirectoryForLinkNames(namecheapUrl) {
    return fetch(namecheapUrl)
      .then(response => response.text())
      .then(text => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        const tableLinks = doc.querySelectorAll('tbody > tr > td > a')
        const fileNames = Array.from(tableLinks)
          .slice(1) // first link is to parent directory
          .map(item => item.innerHTML.slice(0, -1)) // title of link is name of file, remove trailing slash

        return fileNames
      })
      .catch(err => {
        console.log('err scraping namecheap hosting', namecheapUrl, err)
        return []
      })
  }

  function scrapeIcecastHomepageForRadioMetadata() {
    return fetch(radioHomeUrl)
      .then(response => response.text())
      .then(text => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        const tableRows = doc.querySelectorAll('.mountcont tbody tr')

        let streamName = null, streamDescription = null
        tableRows.forEach(r => {
          const tds = r.querySelectorAll('td')
          const title = tds[0].innerText
          const data = tds[1].innerText
          if (title === 'Stream Name:') {
            streamName = data
          } else if (title === 'Stream Description:') {
            streamDescription = data
          }
        })

        return { name: streamName, description: streamDescription }
      })
      .catch(err => {
        console.log('err scraping icecast homepage', err)
        return null
      })
  }

})()
