#!/usr/bin/env python3
import requests
import json

def get_real_booth_data():
    """실제 백엔드에서 부스 데이터를 가져와서 출력"""
    try:
        response = requests.get('http://localhost:8000/api/booths/')
        if response.status_code == 200:
            data = response.json()
            booths = data['data']
            
            print("🎯 실제 백엔드 부스 데이터")
            print("=" * 50)
            print(f"총 {len(booths)}개 부스 발견\n")
            
            for booth in booths:
                print(f"코드: {booth['code']}")
                print(f"이름: {booth['name']}")
                print(f"설명: {booth['description']}")
                print(f"활성화: {booth['is_active']}")
                print(f"참여자 수: {booth['participant_count']}")
                print("-" * 30)
            
            return booths
        else:
            print(f"❌ API 호출 실패: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return None

def generate_real_urls(booths, base_url):
    """실제 부스 데이터로 QR 코드 URL 생성"""
    print(f"\n🔗 QR 코드용 URL 생성")
    print(f"기본 URL: {base_url}")
    print("=" * 50)
    
    urls = []
    for booth in booths:
        if booth['is_active']:  # 활성화된 부스만
            url = f"{base_url}/stamp?booth={booth['code']}"
            urls.append({
                'code': booth['code'],
                'name': booth['name'],
                'url': url
            })
            print(f"{booth['code']} ({booth['name']})")
            print(f"URL: {url}\n")
    
    return urls

if __name__ == "__main__":
    # 1. 실제 부스 데이터 가져오기
    booths = get_real_booth_data()
    
    if booths:
        # 2. 현재 localtunnel URL로 QR 코드 URL 생성
        base_url = "https://polite-eagles-post.loca.lt"
        urls = generate_real_urls(booths, base_url)
        
        print(f"\n📱 QR 코드 테스트용 URL 요약")
        print("=" * 50)
        for url_data in urls:
            print(f"{url_data['code']}: {url_data['url']}")
