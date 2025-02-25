var socket = io();
var board;
var username = Cookies.get('username');
var color;
var users = {};
var points_cookie = Cookies.get('points');
var currentMouseLocation;
var viewMouseLocations = false;
var gameName = 'Unnamed game';
var hidden = true;

var getGameId = function () {
  var parts = window.location.search.substring(1).split('=');
  var object = {};
  for (var i = 0; i < parts.length - 1; i += 2) {
    object[parts[i]] = parts[i + 1];
  }
  return object.g;
};

var register = function () {
  var gameId = getGameId();
  socket.emit('login', {
    sealedUsername: Cookies.get('username'),
    gameId: getGameId()
  });
};

var shuffle = function (array) {
  var swap = function (pos1, pos2) {
    var save = array[pos1];
    array[pos1] = array[pos2];
    array[pos2] = save;
  };

  for (var i = 0; i < array.length; i++) {
    var randomIndex = Math.floor(Math.random() * (array.length - i)) + i;
    swap(i, randomIndex);
  }

  return array;
};

socket.on('connect', register);
socket.on('moneymaker', function (moneymaker_data) {
  loadMoneyMaker();

  function loadMoneyMaker() {
      setTimeout(loadMoneyMaker, moneymaker_data.updateDelay);
      $.get( "/moneymaker", function( data ) {
      console.log(data);
      $( "#moneymaker" ).html( data );
    });
  }
});
socket.on('invalid gameId', function () {
  window.location = '/new';
});
socket.on('set username', function (data) {
  username = data.username;
  Cookies.set('username', data.sealedUsername);
});

socket.on('points cookie', function (data) {
  Cookies.set('points', data.data);
});

socket.on('flag count', function (count) {
  $('#flagCount').text(' and ' + count + ((count == 1) ? ' flag has ' : ' flags have ') + 'been placed');
});

socket.on('board', function (board_data) {
  $('#board').empty();
  board = board_data.board;

  $('#currentDimensions').text(dimensionsToString(board_data.dimensions));

  function chordReveal(x, y) {
    socket.emit('chord reveal', {
      x: x,
      y: y
    })
  }

  var modified_squares = [];
  for (var y in board[0]) {
    for (var x in board) {
      var leftMouseDown = false;
      var rightMouseDown = false;

      $('#board').append($('<span class="square"></span>').prop('id', x + '-' + y).click(function () {
        if (isCurrentlyRevealMode())
          socket.emit('reveal', {
            x: parseInt($(this).prop('id').split('-')[0]),
            y: parseInt($(this).prop('id').split('-')[1])
          });
        else
          socket.emit('flag', {
            x: parseInt($(this).prop('id').split('-')[0]),
            y: parseInt($(this).prop('id').split('-')[1])
          });
      }).on('contextmenu', function () {
        socket.emit('flag', {
          x: parseInt($(this).prop('id').split('-')[0]),
          y: parseInt($(this).prop('id').split('-')[1])
        });
        return false;
      }).on('mousedown', function (e) {
        var button = e.originalEvent.button;
        if (button == 0) {
          leftMouseDown = true;
        } else if (button == 2) {
          rightMouseDown = true;
        }
      }).on('mouseup', function (e) {
        var button = e.originalEvent.button;
        if (leftMouseDown && rightMouseDown) {
          chordReveal(parseInt($(this).prop('id').split('-')[0]), parseInt($(this).prop('id').split('-')[1]));
        }
        if (button == 0) {
          leftMouseDown = false;
        } else if (button == 1) {
          chordReveal(parseInt($(this).prop('id').split('-')[0]), parseInt($(this).prop('id').split('-')[1]));
        } else if (button == 2) {
          rightMouseDown = false;
        }
      }));

      if (board[x][y].flagged || board[x][y].revealed)
        modified_squares.push(board[x][y]);
    }
  }

  var adjustBoardSizeToFit = function () {
    var smallestSideLength = Math.min($(window).height(), $(window).width());
    var offset_landscape_mode = 80;
    if ($(window).height() < $(window).width() + 100) {
      offset_landscape_mode = 400;
    }
    var squareSize = (smallestSideLength - offset_landscape_mode) / Math.max(board_data.dimensions.width, board_data.dimensions.height);
    var marginSize = Math.max(1, Math.floor(squareSize / 50));
    
    var board_margin = 0;
    if ($(window).height() < $(window).width() + 100) {
      board_margin = 200
    }
    $('#board').css('width', (squareSize + (marginSize * 2)) * board_data.dimensions.width) - board_margin;
    $('.square').css('width', squareSize);
    $('.square').css('height', squareSize);
    $('.square').css('borderRadius', squareSize / 10);
    $('.square').css('margin', marginSize);
    $('.square').css('fontSize', squareSize * 0.64);
  };
  $(window).on('load resize', adjustBoardSizeToFit);
  adjustBoardSizeToFit();

  $('.square').hover(function () {
    var coord = {
      x: parseInt($(this).prop('id').split('-')[0]),
      y: parseInt($(this).prop('id').split('-')[1])
    };
    currentMouseLocation = coord.x + '-' + coord.y;
    $(this).css('border-color', color);
    if (viewMouseLocations)
      socket.emit('mouse in', coord);
  }, function () {
    var coord = {
      x: parseInt($(this).prop('id').split('-')[0]),
      y: parseInt($(this).prop('id').split('-')[1])
    };
    currentMouseLocation = null;
    $(this).css('border-color', 'white');
    if (viewMouseLocations)
      socket.emit('mouse out', coord);
  });

  updateSquaresWithDelay(shuffle(modified_squares));
});

socket.on('share game', function (shareData) {
  gameName = shareData.name;
  hidden = shareData.hidden;
  if (shareData.isDefaultGame) {
    window.history.replaceState('Object', 'Title', '/');
    $('#name').prop('disabled', true);
    $('#public').prop('disabled', true);
  }
});

var dimensionsToString = function (dimensions) {
  return dimensions.width + ' by ' + dimensions.height + ' with ' + dimensions.mines + ' mines';
};

socket.on('next dimensions', function (dimensions) {
  $('#nextDimensions').text(dimensionsToString(dimensions));
});

var updateColor = function () {
  var user = username.split('-').splice(0, 2).map((n) => n[0].toUpperCase() + n.slice(1)).join(' '); 
  $('#username').text(user).css('font-weight', 600).css('color', color);
};

var isCurrentlyRevealMode = function () {
  return $('#revealMode').is(':checked');
};

var updateSquare = function (square) {
  var getSymbolForSquare = function (square) {
    if (square.mine || !square.revealed)
      return (square.flagged) ? '⚑' : '';
    return (square.count == 0) ? '' : square.count;
  };

  var symbol = getSymbolForSquare(square);
  $('#' + square.x + '-' + square.y).text(symbol);

  if (square.mine) {
    $('#' + square.x + '-' + square.y).css('background-color', 'red');
  } else if (!square.revealed) {
    // do nothing
  } else if (square.revealedBy != 'default') {
    var color;
    if (users[square.revealedBy]) {
      color = users[square.revealedBy].color;
    } else {
      color = 'white';
      register();
    }
    $('#' + square.x + '-' + square.y).css('background-color', color);
  } else if (square.revealedBy == 'default') {
    $('#' + square.x + '-' + square.y).css('background-color', '#eeeeee');
  }

  if (square.lose == true) {
    $('#' + square.x + '-' + square.y).css('opacity', 0.1);
  }
};

var updateSquares = function (squares) {
  for (var i in squares)
    updateSquare(squares[i]);
};
var updateSquaresWithDelay = function (squares) {
  if (getPreferences().delay == 0)
    return updateSquares(squares);

  var delay = 1;
  if (getPreferences().delay)
    delay = getPreferences().delay;

  if (squares.length <= 0)
    return;

  updateSquare(squares[0]);
  setTimeout(function () {
    updateSquaresWithDelay(squares.splice(1));
  }, delay);
};

socket.on('players', function (players) {
  users = players;
  $('#scoreboard').empty();

  var foundSelf = false;
  for (var name in users) {
    if (name == username) {
      foundSelf = true;
      color = users[name].color;
      updateColor();
    }
    $('#scoreboard').append($('<div class="row"></div>').append($('<div class="col s8"></div>').text(name).css('color', users[name].color)).append($('<div class="col s4"></div>').text(users[name].points).prop('id', name)).css('font-size', 24));
  }

  if (!foundSelf) {
    register();
  }
});

socket.on('mouse locations', function (locations) {
  if (!viewMouseLocations)
    return;

  for (var x in board) {
    for (var y in board[x]) {
      if (currentMouseLocation == x + '-' + y)
        continue;

      if (locations[x + '-' + y])
        $('#' + x + '-' + y).css('border-color', users[locations[x + '-' + y]].color);
      else
        $('#' + x + '-' + y).css('border-color', 'white');
    }
  }
});

socket.on('squares', function (squares) {
  updateSquaresWithDelay(shuffle(squares));
});
socket.on('lose', function (info) {
  var loser = info.loser;
  var squares = info.squares;
  updateSquares(squares);
  M.toast({
    html: escape(loser) + ' hit a mine!',
    displayLength: 5000,
    classes: 'red'
  });
});
socket.on('win', function (winners) {
  M.toast({
    html: escape(winners) + ' won the game!',
    displayLength: 5000,
    classes: 'green'
  });
});
socket.on('reconnect', register);

var defaultPreferences = {
  delay: 5
};
var updateSettingsModal = function () {
  $('#delay').val(getPreferences().delay);
  M.updateTextFields();
};
var getPreferences = function () {
  if (Cookies.get('preferences'))
    return JSON.parse(Cookies.get('preferences'));
  else
    return defaultPreferences;
};
var updatePreferences = function (field, value) {
  var preferences = getPreferences();
  preferences[field] = value;
  Cookies.set('preferences', preferences);
};
var updateShareModal = function () {
  $('#name').val(gameName);
  $('#public').prop('checked', !hidden);
  M.updateTextFields();
};


$(function () {
  $('#submitSize').click(function () {
    socket.emit('next dimensions', {
      width: $('#width').val(),
      height: $('#height').val(),
      mines: $('#mines').val()
    });
  });

  // materialize css initialization
  $('.tooltipped').tooltip({
    delay: 50
  });
  $('.fixed-action-btn').floatingActionButton();
  $('.modal').modal();

  $('#delay').on('keyup change', function () {
    if (Math.abs(parseInt($('#delay').val())) == $('#delay').val() && Math.abs(parseInt($('#delay').val())) <= 20)
      updatePreferences('delay', $('#delay').val());
  });
  $('#settings-button').click(function () {
    updateSettingsModal();
  });

  $('#submitShare').click(function () {
    socket.emit('share game', {
      name: $('#name').val(),
      hidden: !$('#public').is(':checked')
    });
  });
  $('#share-button').click(function () {
    updateShareModal();
  });

  updateSettingsModal();
  M.updateTextFields();
});

var makeRevealActive = function () {
  var element = document.getElementById('revealMode');
  element.click()
  element.classList.toggle('inactive', true);
  document.querySelector('.btn-revealorflagt').classList.add('active');
};

var makeFlagActive = function () {
  document.getElementById('flagMode').click()
  var element = document.getElementById('flagMode');
  element.click()
  element.classList.toggle('inactive', true);
};

var toggleRevealOrFlagActive = function () {
  const buttons = document.querySelectorAll('.btn-revealorflag');
  buttons.forEach(button => {
    button.classList.toggle('inactive');
  });

  const [first, second] = document.querySelectorAll('input[type="radio"][name="mode"]');
  first.checked ? second.checked = true : first.checked = true;
};