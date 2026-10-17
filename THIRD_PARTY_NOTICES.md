# Third-party notices

Career OS's automatic job discovery uses material from **career-ops** (https://github.com/career-ops-hq/career-ops),
by way of ApplyFlux, under the MIT License:

- `src/lib/jobs/boards/catalog.ts`: the tracked company job boards, seeded from `templates/portals.example.yml`.
- `src/lib/jobs/boards/match.ts`: title, location and freshness filters modelled on career-ops' `title_filter`.
- `src/lib/jobs/boards/discover.ts`: Greenhouse / Lever / Ashby public board integration modelled on
  `providers/greenhouse.mjs`, `lever.mjs`, `ashby.mjs`.

```
MIT License

Copyright (c) 2026 Santiago Fernández de Valderrama

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
