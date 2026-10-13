'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectUrl, isAdult, parseM3U, toM3U } = require('../tools/lib/iptv-filters');

test('URL të pranueshme kalojnë', () => {
  for (const u of [
    'https://example.com/live/index.m3u8',
    'http://1.2.3.4:8080/live/ch1/playlist.m3u8',
    'https://cdn.example.com/a.m3u8?quality=hd&lang=sq',
    'https://shd.example.net/live/bitmovin-mbc-1/15cf99af5de54063fdabfefe66adc075/index.m3u8',
  ]) assert.equal(inspectUrl(u).error, undefined, u);
});

test('token/çelës/kredenciale refuzohen', () => {
  const bad = {
    'https://x.com/a.m3u8?token=abc': 'secret-param',
    'https://x.com/a.m3u8?foo=1&Token=abc': 'secret-param',
    'https://x.com/a.m3u8?key=abc': 'secret-param',
    'https://x.com/a.m3u8?cdntoken=abc': 'secret-param',
    'https://x.com/a.m3u8?hdnts=exp=123~hmac=abc': 'secret-param',
    'https://x.com/a.m3u8?sig=zzz&e=1': 'secret-param',
    'https://x.com/a.m3u8?password=1': 'secret-param',
    'https://x.com/token=abc/a.m3u8': 'secret-param',
    'https://user:pw@x.com/a.m3u8': 'credentials',
    'http://t.com:2095/play/lhpjmkfVyhON1JAiZCx7vgvje3t-Jiqa5d94ZBmKAqQgIFxl-Ch6B37eGpkVDb28': 'secret-path',
  };
  for (const [u, why] of Object.entries(bad)) assert.equal(inspectUrl(u).error, why, u);
});

test('protokolle jo-http, YouTube/Twitch dhe host-e private refuzohen', () => {
  assert.equal(inspectUrl('rtmp://x.com/live').error, 'protocol');
  assert.equal(inspectUrl('rtsp://x.com/live').error, 'protocol');
  assert.equal(inspectUrl('srt://x.com:1234').error, 'protocol');
  assert.equal(inspectUrl('mmsh://x.com/a').error, 'protocol');
  assert.equal(inspectUrl('https://www.youtube.com/watch?v=abc').error, 'video-site');
  assert.equal(inspectUrl('https://twitch.tv/foo').error, 'video-site');
  assert.equal(inspectUrl('http://192.168.1.5/a.m3u8').error, 'private-host');
  assert.equal(inspectUrl('http://localhost:8080/a.m3u8').error, 'private-host');
  assert.equal(inspectUrl('nuk-eshte-url').error, 'url-invalid');
});

test('përmbajtja për të rritur zbulohet', () => {
  assert.equal(isAdult({ name: 'Playboy TV' }), true);
  assert.equal(isAdult({ name: 'Brazzers TV Europe' }), true);
  assert.equal(isAdult({ name: 'Xtreme XXX' }), true);
  assert.equal(isAdult({ name: 'Foo', categories: ['xxx'] }), true);
  assert.equal(isAdult({ name: 'Foo', nsfw: true }), true);
  assert.equal(isAdult({ name: 'Foo', group: 'Adult' }), true);
  assert.equal(isAdult({ name: 'Sussex News' }), false);
  assert.equal(isAdult({ name: 'RTK 1' }), false);
  assert.equal(isAdult({ name: 'Essex TV' }), false);
});

test('parseM3U lexon atributet, EXTVLCOPT dhe emra me presje', () => {
  const m3u = [
    '#EXTM3U',
    '#EXTINF:-1 tvg-id="RTK1.xk@SD" tvg-logo="https://l/x.png" group-title="Kosovë",RTK 1 (720p)',
    'https://a.example/rtk1.m3u8',
    '#EXTINF:-1 tvg-id="Foo.us",Foo, Bar',
    '#EXTVLCOPT:http-referrer=https://ref.example/',
    '#EXTVLCOPT:http-user-agent=Mozilla/5.0',
    'http://b.example/foo.m3u8',
    '#EXTINF:-1 tvg-id="Orphan.us",Pa URL',
  ].join('\n');
  const r = parseM3U(m3u);
  assert.equal(r.length, 2);
  assert.deepEqual(
    [r[0].id, r[0].name, r[0].url, r[0].group, r[0].logo],
    ['RTK1.xk@SD', 'RTK 1 (720p)', 'https://a.example/rtk1.m3u8', 'Kosovë', 'https://l/x.png'],
  );
  assert.equal(r[1].name, 'Foo, Bar');
  assert.equal(r[1].ref, 'https://ref.example/');
  assert.equal(r[1].ua, 'Mozilla/5.0');
  const back = parseM3U(toM3U(r));
  assert.deepEqual(back.map((x) => [x.id, x.name, x.url, x.ref]), r.map((x) => [x.id, x.name, x.url, x.ref]));
});
