console.log(document.domain); // Add this to recaptcha
var urlBase = 'https://www.peoplesmart.com';
var setTimeInterval = "";

var loadCurrentTabUrl = function() {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    $("#currentUrl").append(tabs[0].url);
    //pass Linked profile url to create report
    $("#linkedinurlid").val(tabs[0].url);
    var patt = new RegExp("linkedin.com/in/");
    var res = patt.test(tabs[0].url);
    if(res == true){
      checkIsLogin();
    }else{
      $("#login-box1").css("display", "none");
      $("#initial-state").css("display", "block");
    }
  });
}

//---------------------Login Code--------------------------------------
var getLogIn = function(token) {
  //alert(token);
  $("#waitbtn1").css("display", "block");
  event.preventDefault();
  console.log("call-logIn"+token);
  var endpoint='/api/v5/session';
  var url=urlBase + endpoint;
  var formData = {
    user: {
      email: $("#user-email").val(),
      password: $("#user-password").val()
    },
    'g-recaptcha-response': token,
    'invisible-recaptcha': true
  };

  $.ajax({
    url: url,
    method: 'POST',
    data: JSON.stringify(formData),
    dataType: "json",
    contentType: 'application/json',
    encode: true,
    headers: {
      "cache-control": "no-cache",
      'Access-Control-Allow-Origin': urlBase,
    }
  }).done(function(response, textStatus, jqXHR) {
      console.log('Success',response);
      //$("body").append("<pre>" + JSON.stringify(response, undefined, 2) + "</pre>");
      var json_resp = jqXHR.responseJSON;
      var rem_crd = json_resp.account.subscription_info.monthly_reports_remaining;
      var tot_crd = json_resp.account.subscription_info.monthly_report_limit;
      //var str1 = "show_unlimited_reports";
      //var str2 = "?";
      //var res = str1.concat(str2);
      //alert(res);
      //var is_unlimited_plan = json_resp.account.subscription_info.res;
      //alert(is_unlimited_plan);
      $("#waitbtn1").css("display", "none");
      if(rem_crd == "-1" && tot_crd == "-1"){
        $("#unlimited_plan").css("display", "block");
      }else{
        $("#monthly_pan").css("display", "block");
        $("#rem-credits").text(rem_crd);
        $("#tot-credits").text(tot_crd);
      }
      //---------------Set data to chrome storage---------------
      var stdata = {apiak1: '12345', user_info1: {r_crd: rem_crd, t_crd: tot_crd}};
      chrome.storage.local.set({ktcapiak11: stdata}, function() {
        console.log('Data updated in local');
      });

      $("#login-box1").css("display", "none");
      $("#credit-limit").css("display", "block");
      $("#logoutbtn").css("display", "block");
      $("#backbtn").css("display", "none");

  }).fail(function (response) {
      console.log('unsuccess',response);
      $("#error_detail").text("Invalid Username or Password");
      setInterval(function(){window.location.href = "menu.html";},3000);
      //$("body").append("<pre>" + JSON.stringify(response, undefined, 2) + "</pre>");
  });
}

//---------------Get Account Information-------------------------
var getAccountInfo = function() {
  var endpoint = "/api/v5/account.json"
  var url = urlBase + endpoint;
  $.ajax({
    url: url,
    method: 'GET',
    headers: {
      "cache-control": "no-cache",
      'Access-Control-Allow-Origin': urlBase,
    }
  }).done(function (response) {
      console.log('Success', response);
      //$("body").append("<pre>" + JSON.stringify(response, undefined, 2) + "</pre>");
      //-------------Set updated  credit response data-----------------------
      var rem_crd = response.account.subscription_info.monthly_reports_remaining;
      var tot_crd = response.account.subscription_info.monthly_report_limit;
      //console.log(rem_crd);
      //console.log(tot_crd);
      var stdata = {apiak1: '12345', user_info1: {r_crd: rem_crd, t_crd: tot_crd}};
      chrome.storage.local.set({ktcapiak11: stdata}, function() {
        console.log('Data updated in local');
      });

  }).fail(function (response) {
      console.log('unsuccess',response);
  });
}

var onCaptchaError = function() {
  console.log('Captcha Loading Error');
};

$(document).ready(function() {
  $("#getAccountInfoButton").on("click", function() { getAccountInfo(); });
  loadCurrentTabUrl();
});

//------------- Create New user report function ---------------
var creatAccountUser = function(linkedinur) {
  //check credit available or not
  chrome.storage.local.get("ktcapiak11", function(items) {
  var rem_crd = items.ktcapiak11.user_info1.r_crd;
  var tot_crd = items.ktcapiak11.user_info1.t_crd;
  //console.log('here remaining');
  //console.log(rem_crd);
  //console.log(rem_crd);
  if( rem_crd != '0' || rem_crd == '-1' && tot_crd == '-1'){
  var linkedinurl = linkedinur;
  var data1 = JSON.stringify({
    "report_type": "username_report",
    "meta": {
      "username": linkedinurl,
      "report_flags": []
    }
  });
  var endpoint="/api/v5/reports"
  var url = urlBase + endpoint;
  $.ajax({
    url: url,
    method: 'POST',
    data: data1,
    //data: "{\"report_type\":\"username_report\",\"meta\":{\"username\":\"https://www.linkedin.com/in/vishal-verma-149a7244/\",\"report_flags\":[]}}\n\n",
    contentType: 'application/json',
    headers: {
      "cache-control": "no-cache",
      'Access-Control-Allow-Origin': urlBase,
    }
  }).done(function (response) {
      //$("body").append("<pre>" + JSON.stringify(response, undefined, 2) + "</pre>");
      getAccountInfo();
      $("#waitbtn").css("display", "block");
      //get permalink in reposne and pass to get report
      var myPermlink = response.report.permalink;
      getReportData(myPermlink);

  }).fail(function (response) {
      console.log('unsuccess',response);
  });
  }else{
      // console.log('here');
     $("#get_more_credit").css("display", "block");
    }
  });
}

$(document).ready(function() {
  $("#usercreateData").on("click", function() { var linkedinurl = $("#linkedinurlid").val();
  creatAccountUser(linkedinurl); 
  });
});

//--------------------Get actual report--------------------------
var getReportData = function(myPermlink,setTimeInterval) {
    var endpoint="/api/v5/reports/"+myPermlink;
      if(myPermlink != "")
        {
          var url = urlBase + endpoint;
          $.ajax({
            url: url,
            method: 'GET',
            headers: {
            "cache-control": "no-cache",
            'Access-Control-Allow-Origin': urlBase,
            }
          }).done(function(response, textStatus, jqXHR) {
          //$("body").append("<pre>" + JSON.stringify(response, undefined, 2) + "</pre>");
            if(response.meta.status == "202"){
              var timeout=response.polling.timeout + 3000;
              recallAPI('report',timeout,myPermlink);
            }else{
                console.log('no recall');
                clearInterval(setTimeInterval);
                bindReportData(response, textStatus, jqXHR);
            }
          }).fail(function (response) {
            console.log('unsuccess',response);
          });

      }else{ $("body").append("Failed to create Report, Try Agin"); }
  };
//---------------------Recall Api function-------------------------

var recallAPI = function(type,timeout,myPermlink) {
  var setTimeInterval = setInterval(function(){
  if(type == 'report') {
    console.log('recall');
    //console.log(timeout);
    getReportData(myPermlink,setTimeInterval);
  }else{
    //other API response
  }
  },timeout);
};
//-------------------Bind social data------------------------------

  var bindReportData = function(response, textStatus, jqXHR) {
            
            //---------------Set reponse to chrome local storage-------------
            var resdata = {res_dt: response};
            chrome.storage.local.set({response_ajax: resdata,textStatus: textStatus,jqXHR: jqXHR,}, function() {
              console.log('Data updated in local');
            });

              console.log('Login ajax xhr all remain', jqXHR.getResponseHeader('x-ratelimit-remaining-year'));
              console.debug('Login ajax done xhr limit', jqXHR.getResponseHeader('x-ratelimit-limit-year')); 
              console.debug('Login ajax done textStatus', textStatus);
              console.debug('Login ajax done response', response);

                  $.get(chrome.extension.getURL('../html/social_data.html'), function(data) {
                  console.log('Enrichment API response', jqXHR.responseJSON);
                  var json_resp = jqXHR.responseJSON;
                  //var rem_crd = (jqXHR.getResponseHeader('x-ratelimit-remaining-year') != null)?parseInt(jqXHR.getResponseHeader('x-ratelimit-remaining-year')):0;
                  //var tot_crd = (jqXHR.getResponseHeader('x-ratelimit-limit-year') != null)?parseInt(jqXHR.getResponseHeader('x-ratelimit-limit-year')):0;

                  $("#credit-limit").css("display", "none");
                  $("#backbtn").css("display", "block");

                  if ($('.popup').length > 0){
                  //get social icons
                  var mail_icn = chrome.extension.getURL('../img/icons/mail_icon.png');
                  var mob_icn = chrome.extension.getURL('../img/icons/mobile_icon.png');
                  var shar_icn = chrome.extension.getURL('../img/icons/share_icon.png');
                  //alert(json_resp.entities.people.length);
                  if (json_resp.entities.people.length > 0){

                  //--------bind profile data--------------
                  if(json_resp.entities.people[0].images[1] != undefined){
                    var profile_url=json_resp.entities.people[0].images[1].url;
                  }else if(json_resp.entities.people[0].images[0] != undefined){
                    var profile_url=json_resp.entities.people[0].images[0].url;
                  }else{
                      var profile_url="../img/profile_image_new.png";
                  }
                  
                  if(json_resp.entities.people[0].identity.names[0] != undefined){
                    if(json_resp.entities.people[0].identity.names[0].full != null){
                    $("#profile_name").text(json_resp.entities.people[0].identity.names[0].full);}else{
                      $("#profile_name").text("");
                    }
                  }else{
                      $("#profile_name").text("");
                  }
                 
                 if(json_resp.entities.people[0].contact != null){
                  if(json_resp.entities.people[0].contact.addresses[0] != undefined){
                    if(json_resp.entities.people[0].contact.addresses[0].full != null){
                    $("#profile_address").text(json_resp.entities.people[0].contact.addresses[0].full);}else{
                      $("#profile_address").text("");
                    }
                  }else{
                    $("#profile_address").text("");
                  }
                }else{
                  $("#profile_address").text("");
                }
                  // if(json_resp.entities.people[0].contact.addresses[0].parsed.country != null){
                  //   console.log('yes');
                  //   $("#profile_country").text(', ' + json_resp.entities.people[0].contact.addresses[0].parsed.country);}else{
                  //     console.log('no');
                  //     $("#profile_country").text("");
                  //   }

                  if(json_resp.entities.people[0].jobs[0] != undefined){
                  if(json_resp.entities.people[0].jobs[0].company != null){
                    $("#profile_company").text(json_resp.entities.people[0].jobs[0].company + ',');}else{
                      $("#profile_company").text("");
                    }
                  }else{
                    $("#profile_company").text("");
                  }

                  if(json_resp.entities.people[0].jobs[0] != undefined){
                  if(json_resp.entities.people[0].jobs[0].title != null){
                    $("#profile_position").text(json_resp.entities.people[0].jobs[0].title);}else{
                      $("#profile_position").text("");
                    }
                  }else{
                      $("#profile_position").text("");
                  }

                  if(json_resp.entities.people[0].educations[0] != undefined){
                  if(json_resp.entities.people[0].educations[0].school != null){
                    $("#profile_school").text(json_resp.entities.people[0].educations[0].school);}else{
                      $("#profile_school").text("");
                    }
                  }else{
                    $("#profile_school").text("");
                  }
                  
                  $('img.topsection__image').attr('src', profile_url);
                  //---------------------------------------------------------

                    $('#initial-state').html('');
                    $('#login-box').html('');
                    $('#social-data').html(data);   
                    $("#social-data").css("display", "block");              
                      console.log('Social data displayed');

                      $('img.mail-icn').attr('src', mail_icn);
                      $('img.mob-icn').attr('src', mob_icn);
                      $('img.sha-icn').attr('src', shar_icn);
                      //getting the email ids
                      //console.log('Email ids', json_resp.entities.people[0].contact.emails);
                      if(json_resp.entities.people[0].contact != null){
                      var soc_email = json_resp.entities.people[0].contact.emails;

                      if (soc_email.length > 1){
                        $('#soc_eml_more').text('+' + (soc_email.length - 1) + ' more found');
                      }

                      $('#soc_eml_hl_all').html('');
                      soc_email.forEach(function(emails){
                        var allle = '';
                        $('p.soc-eml-pri > a').text(emails.address);
                        allle = '<p class="margin-0"><a href="javascript: void(0);" class="login-text">' + emails.address + '</a></p>';
                        $('#soc_eml_hl_all').append(allle);
                      });

                      //console.log('Phone Nos.', json_resp.entities.people[0].contact.phones);
                      var soc_phones = json_resp.entities.people[0].contact.phones;

                      if (soc_phones.length > 1){
                        $('#soc_pho_more').text('+' + (soc_phones.length - 1) + ' more found');
                      }

                      $('#soc_pho_hl_all').html('');
                      soc_phones.forEach(function(phones){
                        var allle = '';
                        $('p.soc-pho-pri > a').text(usphone(phones.number));
                        allle = '<p class="margin-0"><a href="javascript: void(0);" class="login-text">' + usphone(phones.number) + '</a></p>';
                        $('#soc_pho_hl_all').append(allle);
                      });
                    }
                      //get all the social profiles
                      var soc_prof = json_resp.entities.people[0].social.profiles;
                      //console.log('Social profiles', soc_prof);

                      soc_prof.forEach(function(profiles){
                        //console.log('Profile', profiles);
                        $('#soc_url_hl').html('');

                        //generate the social block
                        appendSocialBlock(profiles);
                      });

                    }else{
                      console.log('Report for linkedin url not generated....');

                      $.get(chrome.extension.getURL('../html/user_info_not_found.html'), function(data) {
                      $('#initial-state').html('');
                      $('#login-box').html('');
                      $('#social-data').html(data);
                      $("#social-data").css("display", "block");
                      $("#credit-limit").css("display", "none");
                      $("#backbtn").css("display", "block");
                      $('#usr_nof_nm_hl').text($('.pv-top-card-section__name').text());
                      
                      });
                    }

                    if ($('.credit-button').length > 0){
                      $('#usr_crd_sh_st').text(rem_crd);
                      $('.credit-button').fadeIn();
                    }
                }
              });

          $("#waitbtn").css("display", "none");
  };

//----------------------Check login function---------------------
   function checkIsLogin(){
    chrome.storage.local.get("ktcapiak11", function(items) {

        if (!chrome.runtime.error) {
            console.log('Check login storage data');
          if (items.ktcapiak11 === undefined){

            $("#login-box1").css("display", "block");
            $("#credit-limit").css("display", "none");
            $("#logoutbtn").css("display", "none");
            $("#initial-state").css("display", "none");
          }else{
            
            $("#login-box1").css("display", "none");
            $("#credit-limit").css("display", "block");
            $("#logoutbtn").css("display", "block");
            $("#backbtn").css("display", "none");
            $("#initial-state").css("display", "none");

            var rem_crd = items.ktcapiak11.user_info1.r_crd;
            var tot_crd = items.ktcapiak11.user_info1.t_crd;

            if(items.ktcapiak11.user_info1.r_crd == "-1" && items.ktcapiak11.user_info1.t_crd == "-1"){

              $("#unlimited_plan").css("display", "block");
            }else{

              $("#monthly_pan").css("display", "block");
              $("#rem-credits").text(rem_crd);
              $("#tot-credits").text(tot_crd);
            }

            //-------------Get response from chrome storage -----------
              chrome.storage.local.get("response_ajax", function(items) {

              if (items.response_ajax === undefined){

              }else{
            //----------------------------------------------------------------
              $.get(chrome.extension.getURL('../html/social_data.html'), function(data) {
                
                  if ($('.popup').length > 0){
                
                  var mail_icn = chrome.extension.getURL('../img/icons/mail_icon.png');
                  var mob_icn = chrome.extension.getURL('../img/icons/mobile_icon.png');
                  var shar_icn = chrome.extension.getURL('../img/icons/share_icon.png');
                  
                  if (items.response_ajax.res_dt.entities.people.length > 0){

                    if(items.response_ajax.res_dt.entities.people[0].images[1] != undefined){
                      var profile_url=items.response_ajax.res_dt.entities.people[0].images[1].url;
                    }else if(items.response_ajax.res_dt.entities.people[0].images[0] != undefined){
                        var profile_url=items.response_ajax.res_dt.entities.people[0].images[0].url;
                    }else{
                      var profile_url="../img/profile_image_new.png";
                    }

                  if(items.response_ajax.res_dt.entities.people[0].identity.names[0] != undefined){
                  if(items.response_ajax.res_dt.entities.people[0].identity.names[0].full != null){
                    $("#profile_name").text(items.response_ajax.res_dt.entities.people[0].identity.names[0].full);}else{
                      $("#profile_name").text("");
                    }
                  }else{
                      $("#profile_name").text("");
                  }
                  
                  if(items.response_ajax.res_dt.entities.people[0].contact != null){
                    if(items.response_ajax.res_dt.entities.people[0].contact.addresses[0] != undefined){
                      if(items.response_ajax.res_dt.entities.people[0].contact.addresses[0].full != null){
                        $("#profile_address").text(items.response_ajax.res_dt.entities.people[0].contact.addresses[0].full);}else{
                      $("#profile_address").text("");
                      }
                    }else{$("#profile_address").text("");}
                  }else{$("#profile_address").text("");
                }
                  // if(items.response_ajax.res_dt.entities.people[0].contact.addresses[0].parsed.country != null){
                  // $("#profile_country").text(', ' + items.response_ajax.res_dt.entities.people[0].contact.addresses[0].parsed.country);}else{
                  //     $("#profile_country").text("");
                  //   }
                  if(items.response_ajax.res_dt.entities.people[0].jobs[0] != undefined){
                  if(items.response_ajax.res_dt.entities.people[0].jobs[0].company != null){
                    $("#profile_company").text(items.response_ajax.res_dt.entities.people[0].jobs[0].company + ',');}else{
                      $("#profile_company").text("");
                    }
                  }else{
                      $("#profile_company").text("");
                  }

                  if(items.response_ajax.res_dt.entities.people[0].jobs[0] != undefined){
                  if(items.response_ajax.res_dt.entities.people[0].jobs[0].title != null){
                   $("#profile_position").text(items.response_ajax.res_dt.entities.people[0].jobs[0].title);}else{
                      $("#profile_position").text("");
                    }
                  }else{
                      $("#profile_position").text("");
                  }

                  if(items.response_ajax.res_dt.entities.people[0].educations[0] != undefined){
                  if(items.response_ajax.res_dt.entities.people[0].educations[0].school != null){
                    $("#profile_school").text(items.response_ajax.res_dt.entities.people[0].educations[0].school);}else{
                      $("#profile_school").text("");
                    }
                  }else{
                      $("#profile_school").text("");
                  }

                  $('img.topsection__image').attr('src', profile_url);
                   //alert('yes 3');
                    $("#credit-limit").css("display", "none");
                    $('#initial-state').html('');
                    $('#login-box').html('');
                    $('#social-data').html(data);   
                    $("#social-data").css("display", "block");     
                     $("#backbtn").css("display", "block");         
                      console.log('Social data displayed');

                      $('img.mail-icn').attr('src', mail_icn);
                      $('img.mob-icn').attr('src', mob_icn);
                      $('img.sha-icn').attr('src', shar_icn);
                      if(items.response_ajax.res_dt.entities.people[0].contact != null){
                      var soc_email = items.response_ajax.res_dt.entities.people[0].contact.emails;

                      if (soc_email.length > 1){
                        $('#soc_eml_more').text('+' + (soc_email.length - 1) + ' more found');
                      }

                      $('#soc_eml_hl_all').html('');
                      soc_email.forEach(function(emails){
                        var allle = '';
                        $('p.soc-eml-pri > a').text(emails.address);
                        allle = '<p class="margin-0"><a href="javascript: void(0);" class="login-text">' + emails.address + '</a></p>';
                        $('#soc_eml_hl_all').append(allle);
                      });

                      //console.log('Phone Nos.', json_resp.entities.people[0].contact.phones);
                      var soc_phones = items.response_ajax.res_dt.entities.people[0].contact.phones;

                      if (soc_phones.length > 1){
                        $('#soc_pho_more').text('+' + (soc_phones.length - 1) + ' more found');
                      }

                      $('#soc_pho_hl_all').html('');
                      soc_phones.forEach(function(phones){
                        var allle = '';
                        $('p.soc-pho-pri > a').text(usphone(phones.number));
                        allle = '<p class="margin-0"><a href="javascript: void(0);" class="login-text">' + usphone(phones.number) + '</a></p>';
                        $('#soc_pho_hl_all').append(allle);
                      });
                    }
                      //get all the social profiles
                      var soc_prof = items.response_ajax.res_dt.entities.people[0].social.profiles;
                      //console.log('Social profiles', soc_prof);

                      soc_prof.forEach(function(profiles){
                        //console.log('Profile', profiles);
                        $('#soc_url_hl').html('');
                        //generate the social block
                        appendSocialBlock(profiles);
                      });

                    }else{
                      console.log('Report for linkedin url not generated....');

                      $.get(chrome.extension.getURL('../html/user_info_not_found.html'), function(data) {
                        $('#initial-state').html('');
                      $('#login-box').html('');
                      $('#social-data').html(data);
                      $("#social-data").css("display", "block");
                      $("#credit-limit").css("display", "none");
                      $("#backbtn").css("display", "block");
                      $('#usr_nof_nm_hl').text($('.pv-top-card-section__name').text());
                      });
                    }

                    if ($('.credit-button').length > 0){
                      $('#usr_crd_sh_st').text(rem_crd);
                      $('.credit-button').fadeIn();
                    }
                  }
              });

            //----------------------------------------------------------------
          }
          });
          //--------------------End response from chrome storage---------------
          }
        }
      });
  }
//----------------------Check Logout function-----------------------
  var Checkedlogout = function(){
    chrome.storage.local.get("ktcapiak11", function(items) {
    //-------------Delete credit response data-----------------------
    for (var key in items) { chrome.storage.local.remove(key) }})

    //-------------Delete report response data-----------------------
    chrome.storage.local.get("response_ajax", function(items1) {
      for (var key in items1) { chrome.storage.local.remove(key)}})
    //---------------------------------------------------------------
      $("#login-box1").css("display", "block");
      $("#credit-limit").css("display", "none");
      $("#social-data").css("display", "none");
      $("#logoutbtn").css("display", "none");
      $("#backbtn").css("display", "none");
      window.location.href = "menu.html";
 }

  $(document).ready(function() {
      $("#logoutbtn").on("click", function() { Checkedlogout(); });
  });

//----------------------Back Button function---------------------
  var BackButtonFun = function(){
    chrome.storage.local.get("response_ajax", function(items1) { for (var key in items1) {
              chrome.storage.local.remove(key)}})
    $("#login-box1").css("display", "none");
    $("#credit-limit").css("display", "block");
    $("#social-data").css("display", "none");
    $("#logoutbtn").css("display", "block");
    $("#backbtn").css("display", "none");

    $("#profile_name").text("Alexis Ohanian");
    $("#profile_address").text("San Francisco, California ");
    // $("#profile_country").text("US");
    $("#profile_company").text("Reddit, ");
    $("#profile_position").text("Co-founder");
    $("#profile_school").text("University of Virginia");
    $('img.topsection__image').attr('src', "../img/profile_image.png");

     chrome.storage.local.get("ktcapiak11", function(items) {

      var rem_crd = items.ktcapiak11.user_info1.r_crd;
      var tot_crd = items.ktcapiak11.user_info1.t_crd;

     if(items.ktcapiak11.user_info1.r_crd == "-1" && items.ktcapiak11.user_info1.t_crd == "-1"){

        $("#monthly_pan").css("display", "none");
        $("#unlimited_plan").css("display", "block");
      }else{
        $("#unlimited_plan").css("display", "none");
        $("#monthly_pan").css("display", "block");
        $("#rem-credits").text(rem_crd);
        $("#tot-credits").text(tot_crd);
      }

    });
     loadCurrentTabUrl();
  }

  $(document).ready(function() {
    $("#backbtn").on("click", function() { BackButtonFun(); });
  });

//-------------------Append social block code-----------------------

var appendSocialBlock = function(prfdata){

  var fb_icn = chrome.extension.getURL('../img/icons/fb_icon.png');
  var tw_icn = chrome.extension.getURL('../img/icons/twitter_icon.png');
  var lnk_icn = chrome.extension.getURL('../img/icons/linkedin_icon.png');
  var pnt_icn = chrome.extension.getURL('../img/icons/pinterest.png');
  var gp_icn = chrome.extension.getURL('../img/icons/google_plus_icon.png');
  var fs_icn = chrome.extension.getURL('../img/icons/foursquare_icon.png');
  var am_icn = chrome.extension.getURL('../img/icons/amazon_icon.png');
  var fl_icn = chrome.extension.getURL('../img/icons/flickr_icon.png');
  var in_icn = chrome.extension.getURL('../img/icons/instagram_icon.png');

  if (prfdata.site !== null){
    $.get(chrome.extension.getURL('../html/social_url_blocks.html'), function(data) {   
      
      if (prfdata.domain === 'linkedin.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', lnk_icn);
        
      }else if (prfdata.domain === 'amazon.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', am_icn);

      }else if (prfdata.domain === 'flickr.com'){
        appendSocialBlockData(data, prfdata);
          $('img.soc-rd-icn').last().attr('src', fl_icn);

      }else if (prfdata.domain === 'plus.google.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', gp_icn);

      }else if (prfdata.domain === 'cyber.law.harvard.edu'){
        //find image for cyber.law.harvard.edu

      }else if (prfdata.domain === 'whitepages.plus'){
        //find image for cyber.law.harvard.edu

      }else if (prfdata.domain === 'blog.beenverified.com'){
        //find image for cyber.law.harvard.edu

      }else if (prfdata.domain === 'beenverified.com'){
        //find image for cyber.law.harvard.edu

      }else if (prfdata.domain === 'twitter.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', tw_icn);

      }else if (prfdata.domain === 'facebook.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', fb_icn);

      }else if (prfdata.domain === 'pinterest.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', pnt_icn);
        
      }else if (prfdata.domain === 'foursquare.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', fs_icn);
        
      }else if (prfdata.domain === 'instagram.com'){
        appendSocialBlockData(data, prfdata);
        $('img.soc-rd-icn').last().attr('src', in_icn);
        
      }else if (prfdata.domain === 'en.gravatar.com'){
        //find image for en.gravatar.com
        
      }else if (prfdata.domain === 'en.gravatar.com'){
        //find image for en.gravatar.com
        
      }else if (prfdata.domain === 'gravatar.com'){
        //find image for gravatar.com
        
      }else if (prfdata.domain === 'angel.co'){
        //find image for angel.co
        
      }else if (prfdata.domain === 'klout.com'){
        //find image for klout.com
        
      }     
    });
  }
};

var appendSocialBlockData = function(htmldata, prfdata){
  $('#soc_url_hl').append(htmldata);
  var sh_icn = chrome.extension.getURL('../img/share-icon.png');
  $('img.soc-sh-icn').last().attr('src', sh_icn);
  $('.soc-rd-url-btn').last().attr('data-href', prfdata.url);
  $('.soc-url-nm').last().text(capitalizeFirstLetter(prfdata.site));
}

$(document).on('click', '#soc_eml_more', function(event){
  event.preventDefault();

  $('.soc-eml-pri').hide();
  $('.soc-eml-more-p').hide();
  $('#soc_eml_hl_all').fadeIn();
});

$(document).on('click', '#soc_pho_more', function(event){
  event.preventDefault();

  $('.soc-pho-pri').hide();
  $('.soc-pho-more-p').hide();
  $('#soc_pho_hl_all').fadeIn();
});

$(document).on('click', '.eml_pho_shwall', function(event){
  event.preventDefault();
  $('#soc_eml_more').trigger('click');
  $('#soc_pho_more').trigger('click');
});

$(document).on('click', '.soc-rd-url-btn', function(event){
  event.preventDefault();
  //console.log(event.target, $(event.target).attr('data-href'));
  var url = $(event.target).attr('data-href');  
  window.open(url, '_blank');
});

var checkString = function(data) {
    return /^[a-z0-9_-]+$/i.test(data)
};

var removeTrailSlash = function (site) {     
    return site.replace(/\/$/, "");
}

var usphone = function (phone) {
    //normalize string and remove all unnecessary characters
    phone = phone.replace(/[^\d]/g, "");

    //check if number length equals to 10
    if (phone.length == 10) {
        //reformat and return phone number
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }

    return null;
}

var capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}