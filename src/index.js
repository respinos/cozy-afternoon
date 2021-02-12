import cozy from 'cozy-sun-bear';

function _parseLocation(location) {
  var self = this;
  var value;

  if ( typeof(location.start) == 'object' ) {
    if ( location.start.location != null ) {
      value = location.start.location;
    } else {
      var percentage = reader.locations.percentageFromCfi(location.start.cfi);
      value = Math.ceil(self._total * percentage);
    }
  } else {
    // PDF bug
    value = parseInt(location.start, 10);
  }

  return value;
}

function _createOption(chapter, tabindex, parent) {

  function pad(value, length) {
      return (value.toString().length < length) ? pad("-"+value, length):value;
  }

  function create(tagName, cls, parent) {
    var node = document.createElement(tagName);
    if ( cls ) {
      // do something
    }
    if ( parent ) {
      parent.appendChild(node);
    }
    return node;
  }

  var option = create('li');
  if ( chapter.href ) {
    var anchor = create('a', null, option);
    if ( chapter.html ) {
      anchor.innerHTML = chapter.html;
    } else {
      anchor.textContent = chapter.label;
    }
    // var tab = pad('', tabindex); tab = tab.length ? tab + ' ' : '';
    // option.textContent = tab + chapter.label;
    anchor.setAttribute('href', chapter.href);
    anchor.setAttribute('data-href', chapter.href);
  } else {
    var span = create('span', null, option);
    span.textContent = chapter.label;
  }

  if ( parent.tagName === 'LI' ) {
    // need to nest
    var tmp = parent.querySelector('ul');
    if ( ! tmp ) {
      tmp = create('ul', null, parent);
    }
    parent = tmp;
  }

  parent.appendChild(option);
  return option;
}


window.cozy = cozy;
var book_href = 'https://s3.amazonaws.com/epubjs/books/alice/';
var reader = cozy.reader('viewer', {
  href: book_href,
  flow: 'paginated',
  layout: 'reflowable',
  manager: 'default'
})

window.reader = reader;

var toolbar_html = `<div id="toolbar--viewer">
  <div class="control-group expanded">
    <input type="text" id="control-current-page" value="" style="width: 6ch" />
    <div class="navigator--control" style="flex-grow: 1;">
      <input type="range" id="control-navigator" min="0" value="100" style="width: 100%" />
    </div>
  </div>
  <div class="control-group">
    <button id="action-go-prev">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-circle" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
      </svg>
    </button>
    <button id="action-go-next">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right-circle" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
      </svg>
    </button>
  </div>
</div>`;

var toolbar = cozy.control.widget.panel({
  region: 'bottom.navigator',
  template: toolbar_html
}).addTo(reader);

var control_current_page = toolbar._container.querySelector('#control-current-page');
var control_navigator = toolbar._container.querySelector('#control-navigator');

toolbar._container.querySelector('#action-go-prev').addEventListener('click', function(event) {
  reader.prev();
})

toolbar._container.querySelector('#action-go-next').addEventListener('click', function(event) {
  reader.next();
})

reader.on('updateLocations', function(locations) {
  var max = reader.locations.total;
  var min = 1;

  control_navigator.max = max;
  control_navigator.min = min;

  var value = _parseLocation(reader.currentLocation());
  control_navigator.value = value;

  var _hasPageNum = ( reader.pageList != null );
  if ( _hasPageNum) {
    var pageList = reader.pageList.pageList;
    var _pageNumRange = [
      pageList[0].pageLabel || pageList[0].page,
      pageList[pageList.length - 1].pageLabel || pageList[pageList.length - 1].page
    ].join('-');
    control_current_page.value = _pageNumRange;
  } else {
    control_current_page.value = `#${value}`;
  }

})

reader.on('updateContents', (data) => {
  var _process = function(items, tabindex, parent) {
    items.forEach(function(item) {
      var option = _createOption(item, tabindex, parent);
      if ( item.subitems && item.subitems.length ) {
        _process(item.subitems, tabindex + 1, option);
      }
    })
  };
  _process(data.toc, 0, document.querySelector('#list--contents'));
});

reader.start(function() {
  reader.display(3);
})