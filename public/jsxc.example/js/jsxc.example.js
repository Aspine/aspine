$(function() {
   jsxc.init({
      loginForm: {
         form: '#form',
         jid: '#username',
         pass: '#password'
      },
      logoutElement: $('#logout'),
      root: '/jsxc.example/jsxc',
      xmpp: {
         url: 'http://aspine.us:5280/http-bind/',
         domain: 'aspine.us',
         resource: 'example'
      }
   });
});
$(document).on('ready.roster.jsxc', function(){
   $('#content').css('right', $('#jsxc_roster').outerWidth() + parseFloat($('#jsxc_roster').css('right')));
});
$(document).on('toggle.roster.jsxc', function(event, state, duration){
   $('#content').animate({
      right: ((state === 'shown') ? $('#jsxc_roster').outerWidth() : 0) + 'px'
   }, duration);
});
