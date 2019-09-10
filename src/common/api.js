import m_contacts from '../mocks/contact';
import m_history from '../mocks/history';
import m_reply from '../mocks/reply';
import global from './global';
import wepy from 'wepy';

export default {
    getHistory(id) {
        let history = wepy.getStorageSync('_wechat_history_') || m_history;
        return new Promise((resolve, reject) => {
            let sorted = history.sort((a, b) => a.time - b.time);
            if (!id) {
                resolve(this.leftJoin(sorted, m_contacts))
            } else {
                resolve(this.leftJoin(sorted.filter((v) => v.from === id || v.to === id), m_contacts))
            }
        })
    },
    timestampToTime(timestamp) {
        var date = new Date(timestamp);
        let Y = date.getFullYear() + '-';
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        let D = date.getDate() + ' ';
        let h = date.getHours() + ':';
        let m = date.getMinutes() + ':';
        let s = date.getSeconds();
        return Y + M + D + h + m + s;
    },
    getMessagaList() {
        let distince = [];
        let rst = [];
        let history = wepy.getStorageSync('_wechat_history_') || m_history;
        console.log('history1', history);
        return new Promise((resolve, reject) => {
            history.forEach((v) => {
                v.day = this.timestampToTime(v.time);
            });
            console.log('history2', history);
            let sorted = history.sort((a, b) => { return b.time - a.time; });
            console.log(sorted);
            sorted.forEach((v) => {
                if (v.from !== 'me' && distince.indexOf(v.from) === -1) {
                    distince.push(v.from);
                };
                if (v.to !== 'me' && distince.indexOf(v.to) === -1) {
                    distince.push(v.to);
                }
            });
            console.log('distance', distince);
            distince.forEach((v) => {
                let pmsg = sorted.filter((msg) => msg.to === v || msg.from === v);
                let lastmsg = pmsg.length ? pmsg[0].msg : '';
                rst.push({
                    id: v,
                    lastmsg: lastmsg,
                })
            });
            setTimeout(() => {
                resolve(this.leftJoin(rst, m_contacts));
            });
        })
    },
    leftJoin(original, contacts) {
        let contactObj = global.getContact();
        let rst = [];

        original.forEach((v) => {
            if (!v.id) {
                v.id = (v.from !== 'me') ? v.from : v.to;
            }
            if (v.id) {
                if (v.id !== 'me') {
                    v.name = contactObj[v.id].name;
                    v.icon = '../mocks/users/' + contactObj[v.id].id + '.png';
                }
                rst.push(v);
            }
        });
        return rst;
    },
    getUserInfo() {
        return new Promise((resolve, reject) => {
            //如果请求过，就用缓存
            let cache = global.getUserInfo();
            if (cache) {
                resolve(cache);
            } else {
                wepy.login().then((res) => {
                    wepy.getUserInfo().then((info) => {
                        resolve(info.userInfo);
                    }).catch(reject);
                }).catch(reject)
            }
        })
    },
    sendMsg(to, msg, type = 'text') {
        return this.msg('me', to, msg, type);
    },
    replyMsg(frm, msg, type = 'text') {
        return this.msg(frm, 'me', msg, type);
    },
    msg(frm, to, msg, type = 'text') {
        let history = wepy.getStorageSync('_wechat_history_') || m_history;
        let msgobj = {
            to: to,
            msg: msg,
            type: type,
            from: frm,
            time: +new Date()
        };
        history.push(msgobj);
        return new Promise((resolve, reject) => {
            wepy.setStorage({ key: '_wechat_history_', data: history }).then(() => {
                resolve(msgobj);
            }).catch(reject);
        })
    },
    getRandomReply(id) {
        let template = m_reply[id];
        if (!template) {
            template = m_reply['other'];
        }

        let index = Math.random() * template.length >> 0;

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(template[index]);
            });
        })
    },
    getContact() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(m_contacts);
            });
        })
    },
    clearStorage() {
        return wepy.clearStorage();
    }
}