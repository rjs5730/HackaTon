/**
 * Created by rjs57 on 2017-05-09.
 */

$(function() {
   var FADE_TIME=150;
   var TYPING_TIMER_LENGTH=400;
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
    var $window=$(window);
    var $usernameInput=$('.usernameInput');
    var $messages=$('.messages');
    var $inputMessage=$('.inputMessage');

    var $loginPage=$('.login.page');
    var $chatPage=$('.chat.page');

    var username;
    var connected=false;
    var typing=false;
    var lastTypingTime;
    var socket=io();

    var loginButton=document.getElementById('loginButton');
    var sendButton=document.getElementById('sendButton');
    loginButton.onclick = function()
    {
        setUsername();
    }
    sendButton.onclick = function()
    {
        sendMessage();
    }

    function setUsername() {
        username=cleanInput($usernameInput.val().trim() ); //닉네임 변수 설정

        if(username) {   //이름을 입력하였을 경우 로그인 페이지 사라지고 채팅 페이지 온
            $("#yourNick").text($usernameInput.val());
            $("#yourNick2").text($usernameInput.val());
            console.log($usernameInput.val());
            $loginPage.fadeOut();  //jquery 숨기는 함수.
            $chatPage.show();      //jquery 보이게 하는 함수.
            $loginPage.off('click');   // loginPage의 click이벤트 삭제
         

            socket.emit('add user',username);  //서버에게 사용자가 추가됨을 알림.
        }
    }

    function sendMessage() {
        var message=$inputMessage.val();   //메세지 변수 값
        message=cleanInput(message);        //<div>html 형태로 변환
        if(message && connected) {         //연결중이고 메세지가 있을경우
            $inputMessage.val('');        //메세지 입력창 초기화
            addChatMessage({          //이름과 메시지를 addChatMessage함수로 넘김
               username:username,
                message: message
            });
            socket.emit('new message',message);  //서버에게 새로운 메세지가 있다고 알림.
        }
    }
    function cleanInput(input) {    // 메세지에 html tag인 <div/> 추가
        return $('<div/>').text(input).text();
    }

    function addParticipantMessage(data) {  // 채팅 참여자 몇명인지 알림.
        var message='';
        if(data.numUsers===1) {
            message+="1명의 참여자가 있습니다.";
        } else {
            message +="이곳에 "+data.numUsers+" 명 참여하고 있습니다.";
        }
        log(message); //메세지를 띄워주는 함수인 log
    }

    function log(message,options) {  // html tag인 <li> 를 추가하여 메세지 포함
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }
    function addMessageElement(el,options) {   //메세지 옵션을 판별하여 메시지 추가.
        var $el=el;

        if(!options) {
            options={};
        }
        if(typeof options.fade ==='undefined') {
            options.fade=true;
        }
        if (typeof options.prepend ==='undefined') {
            options.prepend=false;
        }

        if(options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if(options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop=$messages[0].scrollHeight;  //스크롤이 자동으로 내려가도록
    }

    function addChatMessage(data,options) {   //메세지 보내는 함수
        var $typingMessages=getTypingMessages(data);
        options=options || {};
        if($typingMessages.length !==0) {
            options.fade=false;
            $typingMessages.remove();
        }

      var $usernameDiv=$('<span class="username"/>')
          .text(data.username)
          .css('color',getUsernameColor(data.username));
      var $messageBodyDiv=$('<span class="mesageBody"/>')
          .text(data.message);

      var typingClass=data.typing ? 'typing' : '';
      var $messageDiv=$('<li class="message"/>')
          .data('username',data.username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv);

      addMessageElement($messageDiv,options);
    }

    function addChatTyping(data) {
        data.typing=true;
        data.message=' 님이 입력하고 있습니다.';
        addChatMessage(data);
    }

    function removeChatTyping(data) {  //입력중입니다를 사라지게
        getTypingMessages(data).fadeOut(function() {
            $(this).remove();
        });
    }
    function updateTyping() {
        if(connected) {
            if(!typing) {
                typing=true;
                socket.emit('typing');
            }
            lastTypingTime=(new Date()).getTime(); //현재시간

            setTimeout(function () {
                var typingTimer=(new Date()).getTime();
                var timeDiff=typingTimer-lastTypingTime;
                if(timeDiff>=TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing=false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    function getTypingMessages(data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') ===data.username;
        });
    }

    function getUsernameColor(username) {  //사용자 아이디에 색 추가.
        var hash=7;
        for (var i=0 ; i<username.length; i++) {
            hash=username.charCodeAt(i) +(hash<<5) -hash;
        }
        var index=Math.abs(hash% COLORS.length);
        return COLORS[index];
    }

 /*   $window.keydown(function(event) {
       if(!(event.ctrlKey || event.metaKey || event.altKey)) {
           $currentInput.focus();
       }
       if(event.which===13) {
           if(username) {
               sendMessage();
           } else {
               setUsername();
           }
       }
    }); */

    $inputMessage.on('input',function() {
       updateTyping();
    });


    $inputMessage.click(function() {
        $inputMessage.focus();
    });

    //소켓 이벤트
    socket.on('login',function(data) {
       connected=true;

       var message="환영합니다. 어서오세요. - ";
       log(message,{prepend:true});
       addParticipantMessage(data);
    });

    socket.on('new message',function(data) {
        addChatMessage(data);
    });

    socket.on('user joined',function(data) {
        log(data.username +'  님 입장');
        addParticipantMessage(data);
    });

    socket.on('user left',function(data) {
        log(data.username + ' 나갔습니다.');
        addParticipantMessage(data);
        removeChatTyping(data);
    });

    socket.on('disconnect',function() {
        log('연결이 끊어졌습니다.');
    });

    socket.on('reconnect', function() {
        log('재연결을 시도합니다.');
        if(username) {
            socket.emit('add user',username);
        }
    });

    socket.on('reconnect_error',function() {
        log('재연결에 실패했습니다.');
    });
    socket.on('typing',function(data) {
        addChatTyping(data);
    })
    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });



});
