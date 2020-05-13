# infinite-new-world-radio-player
radio / mix js for infinitenew.world

## Potentially useful links
  * https://code.google.com/archive/p/streamscraper/
  * https://github.com/ghaiklor/icecast-parser

## Notes from Graham
  * show the current name of the radio on air next to the play button on the player if radio was live and allow you to play it.
  * if no radio is available, play a random mix when hitting the play button at the bottom of the site for the first time.
  * and, play a specific mix if you hit a play button next to a specific mix

## Config I've done

  * added CORS to Namecheap file hosting via .htaccess file
    * https://www.namecheap.com/support/knowledgebase/article.aspx/9410/29/how-to-set-up-rules-and-redirects-in-htaccess
    ```
      Header add Access-Control-Allow-Origin: "*"
      Header add Access-Control-Allow-Methods: "*"
      Header add Access-Control-Allow-Headers: "*"
    ```
