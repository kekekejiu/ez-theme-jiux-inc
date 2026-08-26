

import request from './request';





export function getUserInfo() {

    return request({

        url: '/user/info',

        method: 'get'

    });

}





export function getIpLocationInfo() {

    return request({

        url: 'https://myip.ipip.net/json',

        method: 'get',

        baseURL: ''
    });

}





export function redeemGiftCard(giftcard) {

    return request({

        url: '/user/redeemgiftcard',

        method: 'post',

        data: { giftcard }

    });

}


// 套餐兑换码。后端字段名为 redeem_code，失败分支统一 abort(500) 并在 message 中带原因，
// 因此调用方需从 error.response.message 读取具体文案，不能依据响应体的 state 判断成败。
export function redeemPlan(redeemCode) {

    return request({

        url: '/user/redeemPlan',

        method: 'post',

        data: { redeem_code: redeemCode }

    });

}





export function changePassword(data) {

    return request({

        url: '/user/changePassword',

        method: 'post',

        data

    });

}





export function resetSecurity() {

    return request({

        url: '/user/resetSecurity',

        method: 'get'

    });

}





export function updateRemindSettings(data) {

    return request({

        url: '/user/update',

        method: 'post',

        data

    });

}





export function getActiveSession() {

    return request({

        url: '/user/getActiveSession',

        method: 'get'

    });

}





export function getCommConfig() {

    return request({

        url: '/user/comm/config',

        method: 'get'

    });

}





export function getTelegramBotInfo() {

    return request({

        url: '/user/telegram/getBotInfo',

        method: 'get'

    });

}





export function getUserSubscribe() {

    return request({

        url: '/user/getSubscribe',

        method: 'get'

    });

}
