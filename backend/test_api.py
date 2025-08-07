#!/usr/bin/env python
import os
import django
import requests
import json

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qr_stamp_backend.settings')
django.setup()

def test_apis():
    base_url = 'http://localhost:8000/api'
    
    print("🧪 QR 스탬프 시스템 API 테스트")
    print("=" * 50)
    
    # 1. 부스 목록 API 테스트
    print("\n📋 1. 부스 목록 API 테스트")
    try:
        response = requests.get(f'{base_url}/booths/')
        if response.status_code == 200:
            booths = response.json()
            print(f"✅ 성공! 총 {len(booths)}개 부스 조회됨")
            print(f"   첫 번째 부스: {booths[0]['code']} - {booths[0]['name']}")
        else:
            print(f"❌ 실패: {response.status_code}")
            print(f"   응답: {response.text}")
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
    
    # 2. QR 스캔 API 테스트 (새 참여자)
    print("\n🔍 2. QR 스캔 API 테스트 (새 참여자)")
    try:
        data = {'booth_code': 'BOOTH001'}
        response = requests.post(f'{base_url}/scan/', json=data)
        if response.status_code == 201:
            result = response.json()
            print("✅ 성공! 새 참여자 생성 및 스탬프 기록")
            print(f"   참여자 ID: {result['data']['participant_id']}")
            print(f"   부스: {result['data']['booth_name']}")
            print(f"   스탬프 개수: {result['data']['stamp_count']}")
            
            # 참여자 ID 저장 (다음 테스트용)
            participant_id = result['data']['participant_id']
            
            # 3. 같은 부스에서 중복 스캔 테스트
            print("\n🚫 3. 중복 스캔 테스트")
            data['participant_id'] = participant_id
            response = requests.post(f'{base_url}/scan/', json=data)
            if response.status_code == 400:
                result = response.json()
                print("✅ 성공! 중복 스캔 방지 작동")
                print(f"   메시지: {result['message']}")
            else:
                print(f"❌ 중복 방지 실패: {response.status_code}")
            
            # 4. 다른 부스에서 스캔 테스트
            print("\n🎯 4. 다른 부스 스캔 테스트")
            data = {'participant_id': participant_id, 'booth_code': 'BOOTH002'}
            response = requests.post(f'{base_url}/scan/', json=data)
            if response.status_code == 201:
                result = response.json()
                print("✅ 성공! 두 번째 스탬프 획득")
                print(f"   부스: {result['data']['booth_name']}")
                print(f"   스탬프 개수: {result['data']['stamp_count']}")
            else:
                print(f"❌ 실패: {response.status_code}")
            
            # 5. 참여자 통계 조회 테스트
            print("\n📊 5. 참여자 통계 조회 테스트")
            response = requests.get(f'{base_url}/participants/{participant_id}/stats/')
            if response.status_code == 200:
                result = response.json()
                stats = result['data']
                print("✅ 성공! 참여자 통계 조회")
                print(f"   진행률: {stats['progress_percentage']}%")
                print(f"   남은 스탬프: {stats['remaining_stamps']}개")
                print(f"   추천 부스: {len(stats['next_booths'])}개")
            else:
                print(f"❌ 실패: {response.status_code}")
                
        else:
            print(f"❌ 실패: {response.status_code}")
            print(f"   응답: {response.text}")
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 API 테스트 완료!")

if __name__ == '__main__':
    test_apis()
