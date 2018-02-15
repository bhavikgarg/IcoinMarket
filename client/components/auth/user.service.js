'use strict';

angular.module('iCoinApp')
  .factory('User', function ($resource, ApiPath) {
      return $resource(ApiPath + '/api/users/:id/:controller', {
          id: '@_id'
      },
      {
          changePassword: {
              method: 'PUT',
              params: {
                  controller: 'password'
              }
          },
          getById: {
              method: 'GET',
              params: {
                  controller: 'user-info'
              }
          },
          get: {
              method: 'GET',
              params: {
                  id: 'me'
              }
          },
          verifyEmail: {
              method: 'POST',
              params: {
                  controller: 'verify-email'
              }
          },
          update: {
              method: 'PUT',
              params: {
                  controller: 'update-me'
              }
          },
          verifyUserName: {
              method: 'POST',
              params: {
                  controller: 'verify-user-name'
              }
          },
          updateExpiryTime: {
              method: 'POST',
              params: {
                  controller: 'update-expiry'
              }
          },
          forgetPassword: {
              method: 'POST',
              params: {
                  controller: 'forget-password'
              }
          },
          resendVerification: {
              method: 'POST',
              params: {
                  controller: 'resend-verification'
              }
          },
          forgetPassEmail: {
              method: 'GET',
              params: {
                  controller: 'forget-pass-verify'
              }
          },
          changeForgetPassword: {
              method: 'POST',
              params: {
                  controller: 'change-password'
              }
          },
          sendAgainVerificationLink: {
              method: 'POST',
              params: {
                  controller: 'send-verification-link'
              }
          },
          changeEmailAddress: {
              method: 'POST',
              params: {
                  controller: 'change-email'
              }
          },
          findUser: {
              method: 'POST',
              params: {
                  controller: 'find-user'
              }
          },
          getAgentLogs: {
              method: 'GET',
              params: {
                  controller: 'agent-log'
              }
          },
          clearCXView: {
              method: 'POST',
              params: {
                  controller: 'cx-view-update'
              }
          },
          setReferral: {
              method: 'POST',
              params: {
                  controller: 'map-referrals'
              }
          },
          verifySponsor: {
              method: 'POST',
              params: {
                  controller: 'verify-user-sponsor'
              }
          },
          confirmSponsor: {
              method: 'POST',
              params: {
                  controller: 'confirm-sponsor'
              }
          },
          getSponsorInfo: {
              method: 'POST',
              params: {
                  controller: 'sponsor-info'
              }
          },

          changeSponsor: {
              method: 'POST',
              params: {
                  controller: 'change-sponsor'
              }
          },
          isSponsorEmail: {
              method: 'POST',
              params: {
                  controller: 'verify-sponsor-email'
              }
          },
          signupVerifyEmail: {
              method: 'POST',
              params: {
                  controller: 'checkemail'
              }
          },
          getBasicInfo: {
              method: 'POST',
              params: {
                  controller: 'user-info'
              }
          },
          getExpiryTime: {
              method: 'GET',
              params: {
                  controller: 'text-ad-expiry'
              }
          },
          getUserById: {
              method: 'GET',
              params: {
                  controller: 'user-basic'
              }
          },
          getCompOffUsers: {
              method: 'GET',
              params: {
                  controller: 'compoff-users'
              }
          },
          addUserToCompOffList: {
              method: 'POST',
              params: {
                  controller: 'add-compoff-user'
              }
          },
          updateCompoffStatus: {
              method: 'POST',
              params: {
                  controller: 'update-compoff-status'
              }
          },
          getTopCommissionUsers: {
              method: 'GET',
              params: {
                  controller: 'get-top-commission-users'
              }
          },
          getPremiumUsers: {
              method: 'GET',
              params: {
                  controller: 'get-premium-users'
              }
          },
          addUserToPremiumList: {
              method: 'POST',
              params: {
                  controller: 'add-premium-user'
              }
          },
          updatePremiumUserStatus: {
              method: 'POST',
              params: {
                  controller: 'update-premium-status'
              }
          },
          getBusinessUserRoles: {
              method: 'GET',
              params: {
                  controller: 'get-business-roles'
              }
          },
          registerBusinessUser: {
              method: 'POST',
              params: {
                  controller: 'add-business-user'
              }
          },
          getBusinessUsers: {
              method: 'GET',
              params: {
                  controller: 'get-business-users'
              }
          },
          getPortfolioManagers: {
              method: 'GET',
              params: {
                  controller: 'get-portfolio-managers'
              }
          },
          getPortfolioManagerRoles: {
              method: 'GET',
              params: {
                  controller: 'get-portfolio-manager-roles'
              }
          },
          registerPortfolioManager: {
              method: 'POST',
              params: {
                  controller: 'add-portfolio-manager'
              }
          },
          setPassword: {
              method: 'POST',
              params: {
                  controller: 'set-password'
              }
          },
          setPortfolioManagerPassword: {
                method: 'POST',
                params: {
                    controller: 'set-portfolio-manager-password'
                }
          },
          getNonVerifiedUsers: {
            method: 'GET',
            params: {
                controller: 'get-unverified-users'
            }
          },
          pickUser: {
            method: 'POST',
            params: {
                controller: 'pick-user'
            }
          },
          updateUserCallStatus: {
            method: 'POST',
            params: {
                controller: 'update-user-call-status'
            }
          },
          callersReport: {
            method: 'GET',
            params: {
                controller: 'callers-report'
            }
          },
          supportUsersList: {
            method: 'GET',
            params: {
                controller: 'support-users-list'
            }
          },
          portfolioManagersList: {
            method: 'GET',
            params: {
                controller: 'portfolio-managers-list'
            }
          },
          profitLogsReport: {
            method: 'GET',
            params: {
                controller: 'profit-logs-report'
            }
          }
      });
  });