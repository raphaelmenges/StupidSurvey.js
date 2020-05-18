<img align="left" width="64" height="64" src="/assets/favicon/favicon-96x96.png" alt="Icon">

# StupidSurvey.js
Stupidly simple survey framework with JavaScript and **without database**.
It allows to design **single-page surveys with pagination**, **required fields**, and **automatic client-side checkpoints** via Web storage.
The most important HTML form elements have been wrapped to be coveniently available and stylable.
Replies by participants are stored as .json in your nextcloud, or any other file drop.
You can setup the survey by using a Docker container and providing a public nextcloud file drop for the replies.
This does spare you from learning any basics in SQL and you only need to edit the front-end.
If you change any name or option in the front-end, it will be automatically reflected in the incoming .json files.

This framework has been created as part of the [GazeMining](https://gazemining.de/index_en.html) project for a custom survey.
*StupidSurvey.js* has been tested successfully in modern Web browsers like recent versions of Firefox, Edge, Chrome, and Safari.

## Files of interest
In the following a list of files you should touch before releasing your own survey.
1.  [cgi-bin/Processor.py](/cgi-bin/processor.py)
    - [Line 13](/cgi-bin/processor.py#L13): Key of passphrase that a user has to know (consists of page id and element name)
    - [Line 14](/cgi-bin/processor.py#L14): Passphrase that a user has to know (replace `'foo'`)
    - [Line 46](/cgi-bin/processor.py#L46): URL to nexcloud file drop (replace `'foo'` with URL, e.g., `https://.../public.php/webdav/`)
    - [Line 47](/cgi-bin/processor.py#L47): Last part of the URL to a nextcloud file drop (replace `'foo'` with that part, in my case it were 16 letters of random digits and characters)
2. [index.html](/index.html)
    - Example survey with many of the available form elements.
3. [thanks.html](/thanks.html)
    - Page that is displayed to the user after successful submission of the survey. No need to invest too much love, user has already done what we need from it :)

You can adapt the styling by editing the [css](/assets/global.css) file.
Adding further form elements should not be difficult, too.
Have a look at [StupidSurvey.js](/js/StupidSurvey.js), also to know about the parameters for each form element.

## Setup
See [deploy.sh](/deploy.sh) and the [Dockerfile](/dockerfile) for further details.
Should run on any modern docker environment.

## Local setup
Local server with Python 3.8: `python -m http.server --bind localhost --cgi 8000`.
Requires the Python module `requests`.
Submission of replies does only work if you setup [cgi-bin/Processor.py](/cgi-bin/processor.py) correctly.

## Example
In the following an example how a survey can look like.

### Code
Here comes the JavaScript.
```js
var s = StupidSurvey; // namespace of StupidSurvey
s.init(document.getElementById("survey"));

// First page
var page = new s.Page("general"); s.pushPage(page);
page.push(new s.Headline("StupidSurvey.js", 1));
page.push(new s.StrongSeparator());
page.push(new s.Paragraph("Now some minimal example of StupidSurvey.js"));
page.push(new s.Separator());

page.push(new s.Question("How much do you like StupidSurvey.js?"));
page.push(new s.Select("like_select", ["much", "very much", "super much", "super duper much"], true));

page.push(new s.Question("Describe in your own words how much you like StupidSurvey.js!"));
page.push(new s.Text("like_text", true));

page.push(new s.Separator());
page.push(new s.Paragraph("Below you can proceed to the next page of the survey."));

// Second page
var page = new s.Page("submission"); s.pushPage(page);
page.push(new s.Headline("Survey submission"));

page.push(new s.Paragraph("Some passphrase to avoid robots."));
page.push(new s.Text("passphrase", true, false));

// Finalize survey
s.finalize();
```

### Screenshots
This how it looks like in Firefox.
![screenshot of first page](/media/screenshot-1.png)
![screenshot of second page](/media/screenshot-2.png)

### Reply
That is the .json stored from the input given in the screenshots above.
```json
{
  "form": {
    "general.like_select": "super duper much",
    "general.like_text": "cannot say with words"
  },
  "meta": {
    "ip": "127.0.0.1"
  }
}
```

## Acknowledgment
We acknowledge the financial support by the Federal Ministry of Education and Research of Germany under the project number 01IS17095B.

## TODO
- Add area, picture, and space elements to the index.html example.

## License
>The MIT License (MIT)
>
>Copyright (c) 2020 Raphael Menges
>
>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
