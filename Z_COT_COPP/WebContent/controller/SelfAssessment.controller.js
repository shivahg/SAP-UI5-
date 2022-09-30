sap.ui.define([
	"com/esless/cotcopassessment/controller/BaseController",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"com/esless/cotcopassessment/model/Formatter",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/m/Dialog"
	], function (Controller, DateFormat, JSONModel, Formatter, 
			MessageToast,MessageBox,Fragment,Filter,Dialog) {
	"use strict";

	return Controller.extend("com.esless.cotcopassessment.controller.SelfAssessment", {
		oFormatter:Formatter,		
		onInit: function () {
			var today=new Date();
			//var date1MonthBack=new Date();
			//date1MonthBack.setMonth(date1MonthBack.getMonth() - 1);
			var obj={
					busy:false,
					delay:0,
					today:today,
					oAsgnmtAchvmtItems:[],
					oRatingItems:[],
					oPerformItems:[]
			};
			var oPageModel=new JSONModel(obj);
			this.getView().setModel(oPageModel,"oPageModel");

			this.getRouter().getRoute("detail").attachPatternMatched(this._onDetailMatched, this);

			var mode="";
			var compData=this.getOwnerComponent().getComponentData();
			if(compData){
				var sParam=compData.startupParameters;
				if(sParam && sParam.mode){
					mode=sParam.mode[0];
				}
			}
			oPageModel.setProperty("/loginMode",mode);
		},
		//handle detail pattern matched
		_onDetailMatched:function(oEvent){
			var oPageModel=this.getModel("oPageModel");
			var args=oEvent.getParameter("arguments");
			var detailObj=JSON.parse(decodeURIComponent(args.detailObj));
			detailObj.ReqDate=(detailObj.ReqDate == null || detailObj.ReqDate == "" ) ? null: new Date(detailObj.ReqDate);
			detailObj.JoinDate=(detailObj.JoinDate == null || detailObj.JoinDate == "" ) ? null:new Date(detailObj.JoinDate);
			detailObj.ConfDate=(detailObj.ConfDate == null || detailObj.ConfDate == "" ) ? null:new Date(detailObj.ConfDate);
			detailObj.ResubDate=(detailObj.ResubDate == null || detailObj.ResubDate == "" ) ? null:new Date(detailObj.ResubDate);
			oPageModel.setProperty("/hdrData",detailObj);
			oPageModel.setProperty("/oAsgnmtAchvmtItems",[]);
			oPageModel.setProperty("/oRatingItems",[]);
			oPageModel.setProperty("/oPerformItems",[]);
			if(detailObj.navMode=="C"){
				this.addRowsToAsgnSec();
				//this.createRatingSecData();
			}else{
				this.getBackendData();
			}
		},

		addRowsToAsgnSec:function(e){
			var oPageModel=this.getModel("oPageModel");
			var oAsgnmtAchvmtItems=oPageModel.getProperty("/oAsgnmtAchvmtItems");
			for(var i=0;i<2;i++){
				var asgn=this.createAsgnSecObject();
				asgn.Ind="1";
				asgn.Numb=(i+1).toString();
				oAsgnmtAchvmtItems.push(asgn);	
			}

			for(var i=0;i<2;i++){
				var achvmt=this.createAsgnSecObject();
				achvmt.Ind="2";
				achvmt.Numb=(i+1).toString();
				oAsgnmtAchvmtItems.push(achvmt);	
			}
			for(var i=0;i<2;i++){
				var imprmt=this.createAsgnSecObject();
				imprmt.Ind="3";
				imprmt.Numb=(i+1).toString();
				oAsgnmtAchvmtItems.push(imprmt);	
			}
			console.log(oAsgnmtAchvmtItems);
			oPageModel.setProperty("/oAsgnmtAchvmtItems",oAsgnmtAchvmtItems);
		},
		//add rows in create fill form 
		createAsgnSecObject:function(e){
			return {
				RefNo:"00",
				Pernr:"00",
				Action:"",
				ReqDate:null,
				Ind:"",
				Numb:"",
				F1:"",
				F2:"10",
				F3:""
			};
		},

		getBackendData:function(oEvent){
			var oPageModel=this.getModel("oPageModel");
			var mode= oPageModel.getProperty("/loginMode");
			var oFilters=[];
			oFilters.push(new Filter("RefNo","EQ",oPageModel.getProperty("/hdrData/RefNo")));
			oFilters.push(new Filter("Pernr","EQ",oPageModel.getProperty("/hdrData/Pernr")));
			oFilters.push(new Filter("Action","EQ",oPageModel.getProperty("/hdrData/Action")));
			if(mode=="R1"){
				oFilters.push(new Filter("Status","EQ","B"));
			}else if(mode=="HOD"){
				oFilters.push(new Filter("Status","EQ","C"));
			}else if(mode=="CPO"){
				oFilters.push(new Filter("Status","EQ","D"));
			}
			oPageModel.setProperty("/busy",true);
			var oModel=this.getModel();
			var sPath="/cotp_mainSet";
			oModel.read(sPath,{
				filters:oFilters,
				urlParameters:"$expand=cotp_rating_nav,cotp_assign_nav,cotp_perform_nav",
				success:function(oData,oResponse){
					oPageModel.setProperty("/busy",false);

					if(oData.results[0]){
						this.setDataToModel(oData.results[0]);
					}
				}.bind(this),error:function(err){
					oPageModel.setProperty("/busy",false);
					MessageBox.error(err.responseText);
				}.bind(this)});
		},

		setDataToModel:function(data){
			var oPageModel=this.getModel("oPageModel");
			oPageModel.setProperty("/oRatingItems",data.cotp_rating_nav.results);
			oPageModel.setProperty("/oAsgnmtAchvmtItems",data.cotp_assign_nav.results);
			var action=oPageModel.getProperty("/hdrData/navMode") ;
			var status=oPageModel.getProperty("/hdrData/Status");
			var loginMode = oPageModel.getProperty("/loginMode");
			var performObj={
					RefNo:data.RefNo,
					Pernr:data.Pernr,
					Action:data.Action,
					Ind:"1",
					Numb:data.cotp_perform_nav.results.length+1,
					ReqDate:data.ReqDate,
					Rating:"",
					R1Cmt:"",
					HodCmt:"",
					CpoCmt:"",
					EmpCmt:""
			}
			if((action =="E" && status=="A" ) || (loginMode == "R1" && data.cotp_perform_nav.results.length==0)){
				data.cotp_perform_nav.results.push(performObj);
			}
			oPageModel.setProperty("/oPerformItems",data.cotp_perform_nav.results);
		},

		//on update finish table Assignments
		onChangeRatingAsgnmt:function(oEvent){
			var oSrc=oEvent.getSource();
			var sObj=oSrc.getBindingContext("oPageModel").getObject();
			if(parseFloat(sObj.F3)>parseFloat(sObj.F2)){
				oSrc.setValue();
				MessageToast.show("Score cannot be more than Max");
				return;
			}
			this.handleCalculateTotalRatings("totalAsgnmt","ID_TBL_ASGNMT","F2","F3");
		},

		onUpdateFinishedAsgnmt:function(oEvent){
			this.handleCalculateTotalRatings("totalAsgnmt","ID_TBL_ASGNMT","F2","F3");
		},
		//on update finish table Achievements
		onChangeRatingAchmt:function(oEvent){
			var oSrc=oEvent.getSource();
			var sObj=oSrc.getBindingContext("oPageModel").getObject();
			if(parseFloat(sObj.F3)>parseFloat(sObj.F2)){
				oSrc.setValue();
				MessageToast.show("Score cannot be more than Max");
				return;
			}
			this.handleCalculateTotalRatings("totalAchmt","ID_TBL_ACHMT","F2","F3");
		},

		onUpdateFinishedAchmt:function(oEvent){
			this.handleCalculateTotalRatings("totalAchmt","ID_TBL_ACHMT","F2","F3");
		},

		// on update finish table Hod R1 Rating A
		onChangeRatingA:function(oEvent){
			var oSrc=oEvent.getSource();
			if(oSrc.getValue()>4 || oSrc.getValue()<0){
				oSrc.setValue();
				MessageToast.show("Rating should not be between 0 to 4");
				return;
			}
			this.handleCalculateTotalRatings("totalHodR1A","ID_TBL_R1_HOD_RATING_A","R1","HOD");
		},
		onUpdateFinishedHodR1RatingA:function(oEvent){
			this.handleCalculateTotalRatings("totalHodR1A","ID_TBL_R1_HOD_RATING_A","R1","HOD");
		},
		// on update finish table Hod R1 Rating B
		onChangeRatingB:function(oEvent){
			var oSrc=oEvent.getSource();
			if(oSrc.getValue()>10 || oSrc.getValue()<0){
				oSrc.setValue();
				MessageToast.show("Rating should not be between 0 to 10");
				return;
			}
			this.handleCalculateTotalRatings("totalHodR1B","ID_TBL_R1_HOD_RATING_B","R1","HOD");
		},
		onUpdateFinishedHodR1RatingB:function(oEvent){
			this.handleCalculateTotalRatings("totalHodR1B","ID_TBL_R1_HOD_RATING_B","R1","HOD");
		},
		handleCalculateTotalRatings:function(totalProperty,tableId,property1,property2){
			var oPageModel=this.getModel("oPageModel");
			var sTable=this.byId(tableId);
			var sItems=sTable.getItems();
			var total1=0,total2=0;
			for(var i=0;i<sItems.length;i++){
				var sObj=JSON.parse(JSON.stringify(sItems[i].getBindingContext("oPageModel").getObject()));
				if(sObj[property1]==""){
					sObj[property1]="0";
				}
				if(sObj[property2]==""){
					sObj[property2]="0";
				}
				total1=total1 + parseFloat(sObj[property1]);
				total2=total2 + parseFloat(sObj[property2]);
			}
			oPageModel.setProperty("/"+totalProperty+"1",total1);
			oPageModel.setProperty("/"+totalProperty+"2",total2);
		},
		//handle mandatory fields validation 
		handleValidations:function(flag){
			var oPageModel=this.getModel("oPageModel");
			var loginMode=oPageModel.getProperty("/loginMode");
			var hdrData=oPageModel.getProperty("/hdrData");
			var assign_sec=oPageModel.getProperty("/oAsgnmtAchvmtItems");
			var cotp_rating=oPageModel.getProperty("/oRatingItems");
			var perform_sec=oPageModel.getProperty("/oPerformItems");
			var msg="";
			if(!hdrData.Profile){
				msg=msg+"Please enter Current Profile"+"\n";
			}
			
			for(var i=0;i<assign_sec.length;i++){
				var tableName="";
				if(assign_sec[i].Ind=="1"){
					tableName="Assignments";
				}else if(assign_sec[i].Ind=="2"){
					tableName="Achievements";
				}else if(assign_sec[i].Ind=="3"){
					tableName="Improvements";
				}
				if(assign_sec[i].F1==""){
					msg=msg+ "Please fill "+tableName + " for row " + assign_sec[i].Numb +"\n";
				}
				if(assign_sec[i].F2==""){
					if(assign_sec[i].Ind=="3"){
						tableName="Improvements Remarks";
					}
					msg=msg+ "Please fill "+tableName + " Max for row " + assign_sec[i].Numb +"\n";
				}
				if(assign_sec[i].F3=="" && assign_sec[i].Ind !=  3){
					msg=msg+ "Please fill "+tableName + " Score for row " + assign_sec[i].Numb +"\n";
				}
			}
			if(hdrData.navMode !='C'){
				if(flag !="SB"){
					for(var i=0;i<cotp_rating.length;i++){
						if(loginMode == 'R1' && cotp_rating[i].R1==""){
							msg=msg+ "Please fill R1 Rating for "+cotp_rating[i].Text +"\n";
						}else if(loginMode == 'HOD' && cotp_rating[i].HOD==""){
							msg=msg+ "Please fill HOD Rating for "+cotp_rating[i].Text +"\n";
						}
					}
				}

				for(var i=0;i<perform_sec.length;i++){
					if(perform_sec.length-1 !=i){
						continue;
					}
					if(loginMode == 'EMP' && perform_sec[i].EmpCmt==""){
						msg=msg+ "Please fill Employee Remarks for row "+(i+1) +"\n";
					}else if(loginMode == 'R1' && perform_sec[i].R1Cmt==""){
						msg=msg+ "Please fill Reporting Manager Remarks for row "+(i+1) +"\n";
					}else if(loginMode == 'HOD' && perform_sec[i].HodCmt==""){
						msg=msg+ "Please fill HOD Remarks for row "+(i+1) +"\n";
					}else if(loginMode == 'CPO'){
						if(perform_sec[i].CpoCmt==""){
							msg=msg+ "Please fill CPO Remarks for row "+(i+1) +"\n";
						}else if(perform_sec[i].Rating==""){
							msg=msg+ "Please fill Rating for row "+(i+1) +"\n";						
						}
					}
				}
			}
			if(msg!=""){
				MessageBox.error(msg);
				return;
			}
			return true;

		},
		onPressSubmit:function(e){
			if(!this.handleValidations()){
				return;
			}
			var  msg="Are you sure, want to submit?";
			MessageBox.show(msg, {
				icon: MessageBox.Icon.WARNING,
				title: "Confirmation",
				actions: [MessageBox.Action.YES,MessageBox.Action.NO],
				onClose: function(oAction) {
					if(oAction=="YES"){
						this.sendDataToBackend("submitted");						
					}
				}.bind(this)
			});
		},
		onPressApprove:function(e){
			if(!this.handleValidations()){
				return;
			}
			var msg="Are you sure, want to approve";
			MessageBox.show(msg, {
				icon: MessageBox.Icon.WARNING,
				title: "Confirmation",
				actions: [MessageBox.Action.YES,MessageBox.Action.NO],
				onClose: function(oAction) {
					if(oAction=="YES"){
						this.sendDataToBackend("submitted");						
					}
				}.bind(this)
			});
		},

		onPressSendBack:function(e){
			if(!this.handleValidations('SB')){
				return;
			}
			var msg="Are you sure, want to Send Back";
			MessageBox.show(msg, {
				icon: MessageBox.Icon.WARNING,
				title: "Confirmation",
				actions: [MessageBox.Action.YES,MessageBox.Action.NO],
				onClose: function(oAction) {
					if(oAction=="YES"){
						this.sendDataToBackend("sent back");						
					}
				}.bind(this)
			});
		},

		onPressExtend:function(e){
			var stepInput=new sap.m.StepInput({
				value:"0",
				max:6,
				min:0,
				step:3,
				textAlign:"Center"
			});
			var oDialog=this.oDialog=new Dialog({
				title:"Extention",
				busy:"{oPageModel>/busy}",
				busyIndicatorDelay:0,
				content:[
					new sap.m.VBox({
						items:[new sap.m.Label({
							text:"Months:"
						}),
						stepInput,
						]}).addStyleClass("sapUiTinyMargin")],
						buttons:[
							new sap.m.Button({
								text:"Submit",
								press:function(e){
									var sVal=stepInput.getValue();
									if(sVal==0){
										MessageBox.error("Please select valid extention month greater than zero");
										return;
									}
									this.sendDataToBackend("extended",sVal);
								}.bind(this)
							}),new sap.m.Button({
								text:"Cancel",
								press:function(e){
									oDialog.close();
								}.bind(this)
							})]
			});
			this.getView().addDependent(oDialog);
			oDialog.open();
		},

		sendDataToBackend:function(btnAction,extVal){
			var oPageModel=this.getModel("oPageModel");
			var loginMode=oPageModel.getProperty("/loginMode");
			var hdrData=JSON.parse(JSON.stringify(oPageModel.getProperty("/hdrData")));
			var assign_sec=JSON.parse(JSON.stringify(oPageModel.getProperty("/oAsgnmtAchvmtItems")));
			var cotp_rating=JSON.parse(JSON.stringify(oPageModel.getProperty("/oRatingItems")));
			var perform_sec=JSON.parse(JSON.stringify(oPageModel.getProperty("/oPerformItems")));

			var payload=hdrData;
			payload.cotp_assign_nav=[];
			payload.cotp_rating_nav=[];
			payload.cotp_perform_nav=[];

			delete payload.navMode;
			delete payload.monthsFlag;
			payload.ReqDate=payload.ReqDate == null ? null : payload.ReqDate.substring(0,19);
			payload.JoinDate=payload.JoinDate == null ? null : payload.JoinDate.substring(0,19);
			payload.ConfDate=payload.ConfDate == null ? null : payload.ConfDate.substring(0,19);
			payload.ResubDate=payload.ResubDate == null ? null : payload.ResubDate.substring(0,19);
			if(extVal){
				payload.Ext=extVal.toString();
				payload.Status="E";
			}else if(btnAction == "sent back"){
				payload.Status="R";
			}

			for(var i=0;i<assign_sec.length;i++){
				assign_sec[i].ReqDate=!assign_sec[i].ReqDate ? null : assign_sec[i].ReqDate.substring(0,19);
				assign_sec[i].Ind=assign_sec[i].Ind.toString();
				assign_sec[i].Numb=assign_sec[i].Numb.toString();
				delete assign_sec[i].__metadata;
				payload.cotp_assign_nav.push(assign_sec[i]);
			}
			for(var i=0;i<cotp_rating.length;i++){
				cotp_rating[i].ReqDate=!cotp_rating[i].ReqDate? null : cotp_rating[i].ReqDate.substring(0,19);
				cotp_rating[i].Ind=cotp_rating[i].Ind.toString();
				cotp_rating[i].Numb=cotp_rating[i].Numb.toString();
				delete cotp_rating[i].__metadata;
				payload.cotp_rating_nav.push(cotp_rating[i]);
			}
			for(var i=0;i<perform_sec.length;i++){
				perform_sec[i].ReqDate=!perform_sec[i].ReqDate ? null : perform_sec[i].ReqDate.substring(0,19);
				//perform_sec[i].Ind=perform_sec[i].Ind.toString();
				perform_sec[i].Numb=perform_sec[i].Numb.toString();
				delete perform_sec[i].__metadata;
				delete perform_sec[i].Ind;
				payload.cotp_perform_nav.push(perform_sec[i]);
			}
			oPageModel.setProperty("/busy",true);
			var oModel=this.getModel();
			var sPath="/cotp_mainSet";
			oModel.create(sPath,payload,{success:function(oData,oResponse){
				oPageModel.setProperty("/busy",false);
				if(this.oDialog){
					this.oDialog.close();	
				}
				
				var msg="Form "+payload.RefNo + " "+btnAction+ " successfully";
				MessageBox.show(msg, {
					icon: MessageBox.Icon.SUCCESS,
					title: "Success",
					actions: [MessageBox.Action.OK],
					onClose: function(oAction) {
						this.getRouter().navTo("home");
					}.bind(this)
				});
			}.bind(this),error:function(err){
				oPageModel.setProperty("/busy",false);
				MessageBox.error(err.responseText);
			}});
		}

		//End Controller
	});
});