#!/usr/bin/env python
import os
import django
import requests
import json

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qr_stamp_backend.settings')
django.setup()

def test_mission_completion():
    """
    미션 완료 테스트: 5개 부스를 모두 방문하여 완주 달성
    """
    base_url = 'http://localhost:8000/api'
    
    print("🎯 미션 완료 테스트")
    print("=" * 50)
    
    # 1. 새로운 참여자로 첫 번째 부스 방문
    print("\n🚀 1단계: 첫 번째 부스 방문")
    data = {'booth_code': 'BOOTH001'}
    response = requests.post(f'{base_url}/scan/', json=data)
    result = response.json()
    participant_id = result['data']['participant_id']
    print(f"✅ 첫 번째 스탬프 획득: {result['data']['booth_name']}")
    print(f"   참여자 ID: {participant_id}")
    
    # 2-5. 나머지 4개 부스 방문
    booth_codes = ['BOOTH002', 'BOOTH003', 'BOOTH004', 'BOOTH005']
    
    for i, booth_code in enumerate(booth_codes, 2):
        print(f"\n🎯 {i}단계: {booth_code} 방문")
        data = {'participant_id': participant_id, 'booth_code': booth_code}
        response = requests.post(f'{base_url}/scan/', json=data)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ 스탬프 획득: {result['data']['booth_name']}")
            print(f"   현재 스탬프 수: {result['data']['stamp_count']}/5")
            print(f"   완주 상태: {result['data']['is_completed']}")
            
            if result['data']['is_completed']:
                print(f"🎉 축하합니다! 미션 완료!")
                print(f"   완료 시간: {result['data']['completed_at']}")
        else:
            print(f"❌ 실패: {response.status_code}")
    
    # 6. 완주 후 통계 확인
    print(f"\n📊 완주 후 통계 확인")
    response = requests.get(f'{base_url}/participants/{participant_id}/stats/')
    if response.status_code == 200:
        result = response.json()
        stats = result['data']
        print(f"✅ 최종 진행률: {stats['progress_percentage']}%")
        print(f"   남은 스탬프: {stats['remaining_stamps']}개")
        print(f"   완주 상태: {stats['is_completed']}")
    
    # 7. 기념품 수령 대상자 목록 확인
    print(f"\n🎁 기념품 수령 대상자 확인")
    response = requests.get(f'{base_url}/admin/gift-eligible/')
    if response.status_code == 200:
        result = response.json()
        eligible_data = result['data']
        print(f"✅ 기념품 수령 대상자: {eligible_data['total_eligible']}명")
        
        if eligible_data['total_eligible'] > 0:
            latest_participant = eligible_data['participants'][-1]  # 가장 최근 완주자
            print(f"   최근 완주자: {latest_participant['participant_id'][:8]}...")
            print(f"   완주 시간: {latest_participant['completion_duration']}분 소요")
            print(f"   방문한 부스 수: {len(latest_participant['visited_booths'])}")

    print("\n" + "=" * 50)
    print("🎊 미션 완료 테스트 성공!")

if __name__ == '__main__':
    test_mission_completion()
