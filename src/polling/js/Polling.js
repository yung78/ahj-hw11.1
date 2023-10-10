import dateFormat from 'dateformat';
import { interval, fromEvent, catchError, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs/operators';

export default class Polling {
  constructor() {
    this.messageBox = document.querySelector('.message_box');
    this.switcher = document.querySelector('.switch-btn');
    this.newMesages = document.querySelector('.new_messages');
    this.oldMessages = document.querySelector('.old_messages');
    this.url = 'https://my-second-project-iuq6.onrender.com/messages/unread'; // http://localhost:7070/messages/unread
    this.reserveData = [];
    this.messageIds = [];

    this._switcher();
    this._getData();
    this._messageCheck();
    this._addToOld();
  }

  // get-запрос на сервер
  _getData() {
    ajax.getJSON(this.url)
      .pipe(
        catchError((err) => {
          of(this.reserveData);
          // console.log(err);
        }),
      )
      .subscribe(
        (data) => {
          if (data) {
            this.reserveData = data;
            this._dataHendler(data);
          }
        },
      );
  }

  // переключатель новые/старые сообщения
  _switcher() {
    fromEvent(this.switcher, 'click')
      .pipe(
        map((e) => e.target),
      )
      .subscribe((elem) => {
        elem.classList.toggle('switch-on');
        document.querySelector('.show_new').classList.toggle('show_active');
        document.querySelector('.show_old').classList.toggle('show_active');

        document.querySelector('.new_messages').classList.toggle('show_messages');
        document.querySelector('.old_messages').classList.toggle('show_messages');
      });
  }

  // перенос сообений в старые (первый клик по инфо открывает текст, второй переносит сообщение)
  _addToOld() {
    fromEvent(this.newMesages, 'click')
      .pipe(
        map((e) => e.target),
      )
      .subscribe((elem) => {
        if (elem.closest('.info')) {
          const messageBody = elem.closest('.info').nextElementSibling;

          if (messageBody.classList.contains('show_message_text')) {
            messageBody.classList.remove('show_message_text');

            this.oldMessages.append(messageBody.closest('.message'));
          } else {
            elem.closest('.info').firstElementChild.textContent = '✓';
            messageBody.classList.add('show_message_text');
          }
        }
      });
  }

  // создание и добавление сообщения в новые
  _createElement(data) {
    const newMessage = document.createElement('div');

    newMessage.className = 'message';
    let { subject } = data;

    if (data.subject.length > 15) {
      subject = `${data.subject.slice(0, 15)}...`;
    }

    newMessage.innerHTML = `
      <div class="info">
        <div class="read_check"></div>
        <div class="from">${data.from}</div>
        <div class="subject">${subject}</div>
        <div class="received">${dateFormat(Date.now(), 'HH:MM  dd.mm.yyyy')}</div>
      </div>
      <div class="message_text">${data.body}</div>
    `;

    this.newMesages.prepend(newMessage);
  }

  // интервальный вызов запроса
  _messageCheck() {
    interval(2000).subscribe(() => {
      this._getData();
    });
  }

  // обработка ответа
  _dataHendler(data) {
    data.messages.forEach((el) => {
      if (!this.messageIds.includes(el.id)) {
        this.messageIds.push(el.id);
        this._createElement(el);
      }
    });
  }
}
